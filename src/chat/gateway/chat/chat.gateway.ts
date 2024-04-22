import { BadRequestException } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthService } from 'src/auth/auth.service';
import { MessageDto } from 'src/chat/dto/message.dto';
import { RoomDto } from 'src/chat/dto/room.dto';
import { MessageService } from 'src/chat/service/message.service';
import { RoomService } from 'src/chat/service/room.service';
import { User } from 'src/user/user.entity';
import { UserService } from 'src/user/user.service';
import * as fs from 'fs';
@WebSocketGateway()
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private userConnected = [];
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly roomService: RoomService,
    private readonly messageService: MessageService,
  ) {}
  afterInit() {
    console.log('Initial Socket Gateway');
  }
  async handleConnection(client: Socket, ...args: any[]) {
    try {
      const accessToken = client.handshake.headers['authorization'];
      const { sub, username } =
        await this.authService.verifyAccessToken(accessToken);
      if (!sub) this.disconnect(client);

      const user = await this.userService.findUserByID(sub);
      const checkUserConnected = this.userConnected.findIndex(
        (u) => u.userId === user.id,
      );
      if (checkUserConnected === -1) {
        this.userConnected.push({
          userId: user.id,
          socketId: client.id,
        });
      } else {
        this.userConnected[checkUserConnected].socketId === client.id;
      }
      client.data.user = user;
    } catch (err) {
      this.disconnect(client);
    }
  }
  handleDisconnect(client: any) {
    this.userConnected = this.userConnected.filter(
      (u) => u.userId !== client.data.user.id,
    );
  }

  disconnect(client: Socket) {
    return client.disconnect();
  }
  @SubscribeMessage('createRoom')
  async handleMessage(client: Socket, data: RoomDto) {
    const currentUser: User = client.data.user;
    const user = await this.userService.findUserByID(currentUser.id);

    // create newRoom
    const newRoom = await this.roomService.createRoom(currentUser, data);
    // get new list room
    user.rooms = [...user.rooms, newRoom];
    await this.userService.saveUser(user);
    client.data.user = user; // save user with new room
    this.server.to(client.id).emit('getListRoom', user.rooms);
  }
  @SubscribeMessage('requestListRoom')
  async getListRoom(client: Socket) {
    const rooms = await this.roomService.getAllRoomByUserID(
      client.data.user.id,
    );
    console.log('Send :', client.id);
    this.server.to(client.id).emit('getListRoom', rooms);
  }

  @SubscribeMessage('createMessage')
  async getMessage(
    client: Socket,
    data: {
      userId: number;
      roomId: number;
      message: string;
      mimeType: string | null;
    },
  ) {
    try {
      const { message, roomId, userId, mimeType } = data;
      const user = await this.userService.getUser(userId);
      const room = await this.roomService.getRoom(roomId, true);

      // create Message
      const newMessage = await this.messageService.createMessage(user, room, {
        content: message,
        mimeType,
      });
      // inform other in room
      const userInRoomConnected = this.userConnected.filter((user) => {
        const userInRoom = room.users.findIndex((u) => u.id === user.userId);
        return userInRoom !== -1 ? true : false;
      });
      userInRoomConnected.forEach((u) => {
        if (u.userId !== client.data.user.id) {
          // khong gui den chinh minh

          this.server.to(u.socketId).emit('message', {
            from: user.name,
            room: room.name,
            content: newMessage.content,
          });
        }
      });
      /// display
      this.getAllMessagesInRoom(client, { roomId: room.id });
    } catch (err) {
      console.log(err);
      this.server.emit('error', err.message);
      return;
    }
  }
  @SubscribeMessage('requestAllMessagesInRoom')
  async getAllMessagesInRoom(client: Socket, data: { roomId: number }) {
    try {
      const { roomId } = data;
      // check roomId is exist
      const room = await this.roomService.getRoom(roomId);
      // get ALl message in room
      const messages = await this.messageService.getAllMessagesInRoom(roomId);
      // console.log(messages);
      this.server.emit('responseAllMessagesInRoom', messages);
    } catch (err) {
      this.server.to(client.id).emit('error', err.message);
    }
  }

  @SubscribeMessage('inviteToRoom')
  async inviteToRoom(
    client: Socket,
    data: { users: [number]; room: string; roomId: number },
  ) {
    this.userConnected.forEach((user) => {
      if (
        user.userId !== client.data.user.id &&
        data.users.includes(user.userId)
      ) {
        this.server.to(user.socketId).emit('invitation', {
          from: client.data.user.name,
          fromSocket: client.id,
          room: data.room,
          roomId: data.roomId,
        });
        console.log(
          'Send invitation from ' +
            client.data.user.name +
            ` to ${user.userId}`,
        );
      }
    });
  }

  @SubscribeMessage('refuseJoin')
  async refuseJoin(
    client: Socket,
    data: {
      from: string; // name user
      to: string; // socket id
    },
  ) {
    const { to, from } = data;
    this.server.to(to).emit('refuse', `${from} refuse join your room`);

    console.log(`${from} refuse your invitation`);
  }
  @SubscribeMessage('aceptJoinRoom')
  async addUserToRoom(
    client: Socket,
    data: {
      userId: number;
      roomId: number;
      socketResponse: string; // socket id want to response
      from: string; /// name user
    },
  ) {
    const room = await this.roomService.getRoom(data.roomId);
    const checkUserInRoom = room.users.findIndex(
      (user) => user.id === data.userId,
    );
    if (checkUserInRoom !== -1) {
      this.server.to(client.id).emit('error', 'User is exist in room');
      throw new BadRequestException('User is exist in room');
    }

    room.users = [...room.users, client.data.user];
    room.numberMember += 1;
    await this.roomService.saveRoom(room);
    const room1 = await this.roomService.getAllRoomByUserID(
      client.data.user.id,
    );
    const user2Id = this.userConnected.find(
      (user) => user.socketId === data.socketResponse,
    ).userId;

    const room2 = await this.roomService.getAllRoomByUserID(user2Id);
    this.server.to(client.id).emit('getListRoom', room1);
    this.server.to(data.socketResponse).emit('getListRoom', room2);
    console.log(`${client.data.user.name} acept your invitation`);
    this.server
      .to(data.socketResponse)
      .emit('acept', `${client.data.user.name} acpept join your room`);
  }
}
