import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserModule } from 'src/user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/user/user.entity';

@Module({
  controllers: [AuthController],
  providers: [AuthService],
  imports: [UserModule, TypeOrmModule.forFeature([User])],
})
export class AuthModule {}
