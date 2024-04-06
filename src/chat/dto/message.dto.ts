import { IsString } from 'class-validator';
import { User } from 'src/user/user.entity';
import { Room } from '../model/room.entity';

export class MessageDto {
  @IsString()
  content: string;

  mimeType: string | null;

  user?: User;
  room?: Room;
}
