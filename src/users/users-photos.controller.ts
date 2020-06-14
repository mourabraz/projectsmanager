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

  @Get('/:filename')
  async getUserPhoto(
    @Param('filename') filename: string,
    @Res() res: Response,
  ): Promise<void> {
    this.logger.verbose(`Get photo with filename "${filename}"`);

    const file = await this.usersService.getPhotoByFilename(filename);

    res.sendFile(file.filename, {
      root: this.multerConfigService.uploadPhotoDest,
    });
  }

  @Get('/:filename/thumbnail')
  async getUserPhotoThumbnail(
    @Param('filename') filename: string,
    @Res() res: Response,
  ): Promise<void> {
    this.logger.verbose(`Get photo thumbnail with filename "${filename}"`);

    const file = await this.usersService.getPhotoByFilename(filename);

    res.sendFile(`tn-${file.filename}`, {
      root: this.multerConfigService.uploadPhotoDest,
    });
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
