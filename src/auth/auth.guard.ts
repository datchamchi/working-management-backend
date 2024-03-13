import {
  CanActivate,
  ExecutionContext,
  HttpException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    console.log(token);
    if (!token) throw new UnauthorizedException('Token is not exist');

    try {
      const { sub, username } = await this.jwtService.verifyAsync(token, {
        secret: process.env.ACCESS_TOKEN_KEY,
      });
      return true;
    } catch (err) {
      console.log(err);
      throw new HttpException(err.message, 419);
    }
  }
  private extractTokenFromHeader(request: Request) {
    const [type, token] = request.headers?.authorization.split(' ');
    return type === 'Bearer' ? token : undefined;
  }
}
