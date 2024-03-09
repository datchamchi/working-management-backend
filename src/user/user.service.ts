import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Repository } from 'typeorm';
import { UserDto } from './user.dto';
import { hash } from 'bcryptjs';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  async createUser(user: UserDto) {
    const existUser = await this.findUserByEmail(user.email);
    if (existUser) throw new BadRequestException('User is exist');
    const hashPassword = await hash(user.password, 10);
    try {
      const { password, ...newUser } = await this.userRepository.save({
        ...user,
        password: hashPassword,
      });
      return newUser;
    } catch (err) {
      console.log(err);
      return;
    }
  }
  async findUserByEmail(email: string) {
    const user = await this.userRepository.findOne({ where: { email } });
    return user ? true : false;
  }
}
