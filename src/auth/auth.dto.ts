import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(5, { message: 'Password must be more than 5 character' })
  password: string;
}
