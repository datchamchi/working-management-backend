import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/user/user.entity';
import { Repository } from 'typeorm';
import { LoginDto } from './auth.dto';
import { compare } from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}
  async login(loginDto: LoginDto) {
    const existUser = await this.userRepository.findOne({
      where: { email: loginDto.email },
    });
    if (!existUser) return new BadRequestException('Email is invalid');
    const verifyPassword = await compare(loginDto.password, existUser.password);
    if (!verifyPassword) return new BadRequestException('Wrong password');
    const { password, ...user } = existUser;
    return user;
  }
}
