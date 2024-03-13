import {
  Body,
  Controller,
  Get,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UserDto } from './user.dto';
import { AuthGuard } from '../auth/auth.guard';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  async createUser(@Body() user: UserDto) {
    return await this.userService.createUser(user);
  }

  @UseGuards(AuthGuard)
  @Get()
  async getAllUser() {
    return await this.userService.getAllUser();
  }
  @Get(':id')
  async getUser(@Body('id') id: number) {
    return await this.userService.getUser(id);
  }
}
