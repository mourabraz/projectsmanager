import {
  Controller,
  UseGuards,
  Logger,
  Post,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';

import { UsersService } from './users.service';
import { User } from './user.entity';
import { GetUser } from '../auth/get-user.decorator';

@Controller('users/photo')
@UseGuards(AuthGuard())
export class UsersPhotosController {
  private logger = new Logger(UsersPhotosController.name);

  constructor(private usersService: UsersService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  uploadPhoto(@UploadedFile() file, @GetUser() user: User): Promise<User> {
    this.logger.verbose(`User "${user.email}" upload photo`);

    console.log(file);

    return null;
  }
}
