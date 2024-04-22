import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RoomDto } from 'src/chat/dto/room.dto';
import { Room } from 'src/chat/model/room.entity';
import { User } from 'src/user/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class RoomService {
  constructor(
    @InjectRepository(Room) private readonly roomRepository: Repository<Room>,
  ) {}
  async saveRoom(room: RoomDto) {
    return await this.roomRepository.save(room);
  }
  async createRoom(user: User, roomDto: RoomDto) {
    try {
      const room = await this.roomRepository.save({
        ...roomDto,
        leader: user.name,
        users: [user],
      });

      return room;
    } catch (err) {
      console.log(err);
      throw new BadRequestException();
    }
  }
  async getRoom(roomId: number, selectUser: boolean = true) {
    const room = await this.roomRepository.findOne(
      selectUser
        ? {
            relations: ['users'],
            where: { id: roomId },
          }
        : { where: { id: roomId } },
    );
    if (!room) throw new BadRequestException('Room is not exist');
    return room;
  }
  async addUserToRoom(user: User, room: Room) {
    room.users.push(user);
    room.numberMember = room.numberMember + 1;
    return room;
  }
  async getAllRoomByUserID(userID: number) {
    // const rooms = await this.roomRepository.find({
    //   where: { users: { id: userID } },
    //   relations: { users: true },
    // });
    const rooms = await this.roomRepository
      .createQueryBuilder('room')
      .leftJoinAndSelect('room.users', 'user')
      .where('user.id = :id', { id: userID })
      .getMany();
    return rooms;
  }
}
