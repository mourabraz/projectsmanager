import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

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

  async uploadFileForTaskId(
    taskId: string,
    file,
    user: User,
  ): Promise<{ url: string; path: string; id: string }> {
    try {
      console.log(file);

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

      return {
        url: `${this.appConfigService.url}/files/${fiile.path}`,
        id: fiile.id,
        path: fiile.path,
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
