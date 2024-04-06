import {
  CanActivate,
  ExecutionContext,
  HttpException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) throw new UnauthorizedException('Token is not exist');
    try {
      const { sub, username } = await this.authService.verifyAccessToken(token);
      return true;
    } catch (err) {
      // console.log(err);
      throw new HttpException(err.message, 419);
    }
  }
  private extractTokenFromHeader(request: Request) {
    if (!request.headers.authorization) return undefined;
    const [type, token] = request.headers?.authorization.split(' ');
    return type === 'Bearer' ? token : undefined;
  }
}
