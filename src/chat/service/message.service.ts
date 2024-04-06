import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Message } from '../model/message.entity';
import { Repository } from 'typeorm';
import { MessageDto } from '../dto/message.dto';
import { Room } from '../model/room.entity';
import { User } from 'src/user/user.entity';

@Injectable()
export class MessageService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
  ) {}

  async createMessage(user: User, room: Room, data: MessageDto) {
    try {
      const message = await this.messageRepo.save(data);
      message.user = user;
      message.room = room;

      return await this.messageRepo.save(message);
    } catch (err) {
      throw new BadRequestException(err);
    }
  }
  async getAllMessagesInRoom(roomId: number) {
    const messages = await this.messageRepo.find({
      relations: ['room', 'user'],
      where: { room: { id: roomId } },
    });
    return messages;
  }
}
