import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class UserDto {
  @IsEmail()
  email: string;

  @IsString()
  name: string;

  @IsString()
  @MinLength(5, { message: 'Password muse be more than 5 character' })
  password: string;

  @IsString()
  @IsOptional()
  avatarUrl?: string;
}
