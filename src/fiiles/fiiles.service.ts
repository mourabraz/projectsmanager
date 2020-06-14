import {
  Injectable,
  Logger,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as Jimp from 'jimp';

import { AppConfigService } from '../config/app/config.service';

import { FiileRepository } from './fiile.repository';
import { MulterConfigService } from '../config/multer/config.service';

import { User } from '../users/user.entity';
import { Fiile } from './fiile.entity';
import { TasksService } from '../tasks/tasks.service';

const MimetypesMapEnum = {
  'image/jpeg': 'IMAGE',
  'image/jpg': 'IMAGE',
  'image/gif': 'IMAGE',
  'image/png': 'IMAGE',
  'application/pdf': 'PDF',
  'text/plain': 'DOC',
  'application/vnd.oasis.opendocument.text': 'DOC',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    'DOC',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation':
    'ANY',
};

@Injectable()
export class FiilesService {
  private logger = new Logger(FiilesService.name);

  constructor(
    @InjectRepository(FiileRepository)
    private fiileRepository: FiileRepository,
    private appConfigService: AppConfigService,
    private multerConfigService: MulterConfigService,
    private tasksService: TasksService,
  ) {}

  async getByFilename(path: string): Promise<Fiile> {
    const fiile = await this.fiileRepository.findOne({ where: { path } });

    if (!fiile) {
      this.logger.verbose(`File with path "${path}" not found.`);

      throw new NotFoundException();
    }

    return fiile;
  }

  async uploadFileForTaskId(
    taskId: string,
    file,
    user: User,
  ): Promise<{ url: string; path: string; id: string }> {
    try {
      //check if task exists and is related to authenticated user
      await this.tasksService.getTaskByIdForUser(taskId, user);

      const fiile = new Fiile();
      fiile.userId = user.id;
      fiile.name = file.originalname;
      fiile.type = MimetypesMapEnum[file.mimetype];
      fiile.path = file.filename;
      fiile.size = file.size;
      fiile.taskId = taskId;

      await this.fiileRepository.save(fiile);

      if (fiile.type === 'IMAGE') {
        const imageCopy = await Jimp.read(file.path);

        if (imageCopy.bitmap.width > 500) {
          await imageCopy.resize(500, Jimp.AUTO);
        }
        await imageCopy.writeAsync(file.destination + '/tn-' + file.filename);
      }

      const newFiile = await this.fiileRepository.findOne({ path: fiile.path });

      return {
        url: `${this.appConfigService.url}/files/${fiile.path}`,
        ...newFiile,
      };
    } catch (error) {
      this.logger.error(
        `Failed to upload user's file "${user.email}".`,
        error.stack,
      );

      throw new InternalServerErrorException();
    }
  }
}
