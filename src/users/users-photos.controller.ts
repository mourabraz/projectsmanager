import { Response } from 'express';
import {
  Controller,
  UseGuards,
  Logger,
  Post,
  UseInterceptors,
  UploadedFile,
  Get,
  Param,
  Res,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';

import { UsersService } from './users.service';
import { User } from './user.entity';
import { GetUser } from '../auth/get-user.decorator';
import { MulterConfigService } from '../config/multer/config.service';

@Controller('users/photo')
export class UsersPhotosController {
  private logger = new Logger(UsersPhotosController.name);

  constructor(
    private usersService: UsersService,
    private multerConfigService: MulterConfigService,
  ) {}

  @Get('/:id')
  async getUserPhoto(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Res() res: Response,
  ): Promise<void> {
    this.logger.verbose(`Get photo with id "${id}"`);

    const filename = await this.usersService.getPhotoFilename(id);

    res.sendFile(filename, { root: this.multerConfigService.uploadPhotoDest });
  }

  @Post()
  @UseGuards(AuthGuard())
  @UseInterceptors(FileInterceptor('file'))
  uploadPhoto(
    @UploadedFile() file,
    @GetUser() user: User,
  ): Promise<{ url: string; filename: string; id: string }> {
    this.logger.verbose(`User "${user.email}" upload photo`);

    return this.usersService.updateUserPhoto(file, user);
  }
}
