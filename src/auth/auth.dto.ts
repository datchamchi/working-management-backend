import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Email invalid' })
  email: string;

  @IsString()
  @MinLength(5, { message: 'Password must more 5 character' })
  password: string;
}
