import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity';
import { In, Repository } from 'typeorm';
import { UserDto } from './user.dto';
import { hash } from 'bcryptjs';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  async createUser(user: UserDto) {
    const existUser = await this.findUserByEmail(user.email);
    // if (existUser) throw new BadRequestException('User is exist');
    if (existUser)
      throw new HttpException('User is exist', 401, { cause: 'User is exit' });
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
    try {
      const user = await this.userRepository
        .createQueryBuilder('users')
        .where('users.email = :email', { email })
        .getOne();
      return user;
    } catch (err) {
      throw new BadRequestException('User not found');
    }
  }
  async findUserByID(id: number, selectRoom: boolean = true) {
    try {
      const user = await this.userRepository.findOne(
        selectRoom
          ? {
              where: { id },
              relations: ['rooms'],
            }
          : {
              where: { id },
            },
      );
      return user;
    } catch (err) {
      console.log(err);
      throw new BadRequestException('UserID not found');
    }
  }
  async getAllUser() {
    return await this.userRepository.find();
  }
  async getUser(id: number) {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) throw new BadRequestException('User is not exist');
    return user;
  }
  async deleteUser(id: number) {
    try {
      const res = await this.userRepository.delete({ id });
      return 'Delete user successfully';
    } catch (err) {
      throw new BadRequestException();
    }
  }
}
