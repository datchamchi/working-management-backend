import {
  BadRequestException,
  HttpException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/user/user.entity';
import { Repository } from 'typeorm';
import { LoginDto } from './auth.dto';
import { compare } from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}
  async login(loginDto: LoginDto) {
    try {
      // const allUser = await this.userRepository.find();
      // console.log(allUser);
      const existUser = await this.userRepository.findOne({
        where: { email: loginDto.email },
      });
      // console.log(existUser, loginDto.email);
      if (existUser == null) return new BadRequestException('Email is invalid');
      const verifyPassword = await compare(
        loginDto.password,
        existUser.password,
      );
      if (!verifyPassword) return new BadRequestException('Wrong password');
      const { password, ...user } = existUser;
      const payload = { sub: user.id, username: user.name };
      const { accessToken, refreshToken } = await this.getToken(payload);
      return {
        user: existUser,
        accessToken,
        refreshToken,
      };
    } catch (err) {
      return new HttpException('Something went wrong', 400);
    }
  }
  async getToken(payload: { sub: number; username: string }) {
    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: '1h',
      secret: process.env.ACCESS_TOKEN_KEY,
    });
    const refreshToken = await this.jwtService.signAsync(payload, {
      expiresIn: '7d',
      secret: process.env.REFRESH_TOKEN_KEY,
    });
    return {
      accessToken,
      refreshToken,
    };
  }
  async verifyAccessToken(
    accessToken: string,
  ): Promise<{ sub: number; username: string }> {
    try {
      return await this.jwtService.verifyAsync(accessToken, {
        secret: process.env.ACCESS_TOKEN_KEY,
      });
    } catch {
      throw new UnauthorizedException();
    }
  }
  async refreshToken(refreshToken: string) {
    try {
      const { sub, username } = await this.jwtService.verifyAsync(
        refreshToken,
        {
          secret: process.env.REFRESH_TOKEN_KEY,
        },
      );
      const token = await this.getToken({ sub, username });
      return token;
    } catch (err) {
      return new HttpException('RefreshToken is invalid', 401);
    }
  }
}
