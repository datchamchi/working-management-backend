import { IsString } from 'class-validator';
import { User } from 'src/user/user.entity';

export class RoomDto {
  @IsString()
  name: string;

  users?: User[];
}
