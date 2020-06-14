import { Response } from 'express';
import {
  Controller,
  UseGuards,
  Logger,
  Post,
  UseInterceptors,
  UploadedFile,
  Param,
  ParseUUIDPipe,
  Get,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';

import { FiilesService } from './fiiles.service';
import { GetUser } from '../auth/get-user.decorator';
import { MulterConfigService } from '../config/multer/config.service';
import { User } from '../users/user.entity';

@Controller('files')
export class FiilesController {
  private logger = new Logger(FiilesController.name);

  constructor(
    private fiilesService: FiilesService,
    private multerConfigService: MulterConfigService,
  ) {}

  @Get('/:filename')
  async getFile(
    @Param('filename') filename: string,
    @Res() res: Response,
  ): Promise<void> {
    this.logger.verbose(`Get file with filename "${filename}"`);

    const file = await this.fiilesService.getByFilename(filename);

    res.sendFile(file.path, {
      root: this.multerConfigService.uploadFileDest,
    });
  }

  @Get('/:filename/thumbnail')
  async getFileThumbnail(
    @Param('filename') filename: string,
    @Res() res: Response,
  ): Promise<void> {
    this.logger.verbose(`Get file thumbnail with filename "${filename}"`);

    const file = await this.fiilesService.getByFilename(filename);

    if (file.type !== 'IMAGE') {
      throw new BadRequestException();
    }

    res.sendFile(`tn-${file.path}`, {
      root: this.multerConfigService.uploadFileDest,
    });
  }

  @Post('/:id/task')
  @UseGuards(AuthGuard())
  @UseInterceptors(FileInterceptor('file'))
  uploadForTask(
    @Param('id', new ParseUUIDPipe()) id: string,
    @UploadedFile() file,
    @GetUser() user: User,
  ): Promise<{ url: string; path: string; id: string }> {
    this.logger.verbose(`User "${user.email}" upload file`);

    return this.fiilesService.uploadFileForTaskId(id, file, user);
  }
}
