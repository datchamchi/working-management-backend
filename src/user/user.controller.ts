import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  ParseFilePipe,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UserDto } from './user.dto';
import { AuthGuard } from '../auth/auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @HttpCode(201)
  async createUser(@Body() user: UserDto) {
    return await this.userService.createUser(user);
  }

  @Get()
  async getAllUser(@Query() q: { key: string }) {
    const users = await this.userService.getAllUser(q.key);
    return users;
  }
  @Get(':id')
  async getUser(@Param('id') id: number) {
    return await this.userService.getUser(id);
  }

  @Delete(':id')
  @HttpCode(204)
  async deleteUser(@Param('id') id: number) {
    return await this.userService.deleteUser(id);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('file'))
  async updateUser(
    @Param('id') id: number,
    @UploadedFile(
      new ParseFilePipe({
        validators: [new FileTypeValidator({ fileType: /^image/ })],
        exceptionFactory: (error) => {
          throw new BadRequestException('Must be acpet image jpeg/png');
        },
      }),
    )
    file: Express.Multer.File,
  ) {
    console.log(id);
    console.log(file);
  }
}
