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

      client.data.user = user;
      // this.server.emit('getListRoom', user.rooms);
    } catch (err) {
      this.disconnect(client);
    }
  }
  handleDisconnect(client: any) {}

  disconnect(client: Socket) {
    return client.disconnect();
  }
  @SubscribeMessage('createRoom')
  async handleMessage(client: Socket, data: RoomDto) {
    const currentUser: User = client.data.user;

    // create newRoom
    const newRoom = await this.roomService.createRoom(currentUser, data);

    // get new list room
    const user = await this.userService.findUserByID(currentUser.id);
    client.data.user = user; // save user with new room
  }
  @SubscribeMessage('requestListRoom')
  async getListRoom(client: Socket) {
    const rooms = await this.roomService.getAllRoomByUserID(
      client.data.user.id,
    );
    console.log('Send :', client.id);
    this.server.to(client.id).emit('getListRoom', rooms);
  }

  @SubscribeMessage('addUserToRoom')
  async addUserToRoom(
    client: Socket,
    data: { userId: number; roomId: number },
  ) {
    const room = await this.roomService.getRoom(data.roomId);
    const checkUserInRoom = room.users.findIndex(
      (user) => user.id === data.userId,
    );
    if (checkUserInRoom !== -1) {
      this.server.to(client.id).emit('error', 'User is exist in room');
      throw new BadRequestException('User is exist in room');
    }
    const userData = await this.userService.findUserByID(data.userId, false);
    room.users.push(userData);
    this.roomService.saveRoom(room);
    this.getListRoom(client);
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
      console.log(mimeType);
      const user = await this.userService.getUser(userId);
      const room = await this.roomService.getRoom(roomId, false);
      const newMessage = await this.messageService.createMessage(user, room, {
        content: message,
        mimeType,
      });

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
}
