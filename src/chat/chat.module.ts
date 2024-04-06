import { Module } from '@nestjs/common';
import { ChatGateway } from './gateway/chat/chat.gateway';
import { AuthModule } from 'src/auth/auth.module';
import { RoomService } from './service/room.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Room } from './model/room.entity';
import { UserModule } from 'src/user/user.module';
import { Message } from './model/message.entity';
import { MessageService } from './service/message.service';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([Room, Message]), UserModule],
  providers: [ChatGateway, RoomService, MessageService],
})
export class ChatModule {}
