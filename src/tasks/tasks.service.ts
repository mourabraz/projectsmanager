import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { TaskRepository } from './task.repository';

import { User } from '../users/user.entity';
import { Task } from './task.entity';
//import { CreateTaskDto } from './dto/create-task.dto';

@Injectable()
export class TasksService {
  private logger = new Logger(TasksService.name);

  constructor(
    @InjectRepository(TaskRepository)
    private taskRepository: TaskRepository,
  ) {}

  async getTaskById(id: number, user: User): Promise<Task> {
    const found = await this.taskRepository.findOne({
      where: { id, userId: user.id },
    });

    if (!found) {
      this.logger.verbose(
        `Task with id "${id}" not found for owner id: "${user.id}".`,
      );

      throw new NotFoundException();
    }

    return found;
  }

  // async createTask(createTaskDto: CreateTaskDto, user: User): Promise<Task> {
  //   return this.taskRepository.createTask(createTaskDto, user);
  // }
}
