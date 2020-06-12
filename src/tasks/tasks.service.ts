import {
  Injectable,
  NotFoundException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { TaskRepository } from './task.repository';
import { User } from '../users/user.entity';
import { Task } from './task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { StatusTaskDto } from './dto/status-task.dto';
import { ProjectsService } from '../projects/projects.service';

@Injectable()
export class TasksService {
  private logger = new Logger(TasksService.name);

  constructor(
    @InjectRepository(TaskRepository)
    private taskRepository: TaskRepository,
    private projectsService: ProjectsService,
  ) {}

  async getTaskByIdForUser(id: string, user: User): Promise<Task> {
    const found = await this.taskRepository.getTaskByIdForUser(id, user);

    if (!found) {
      this.logger.verbose(
        `Task with id "${id}" not found for user: "${user.email}".`,
      );

      throw new NotFoundException();
    }

    return found;
  }

  async getTasksByProjectId(projectId: string, user: User): Promise<Task[]> {
    // check if projectId exists and is related to authenticated user
    await this.projectsService.getProjectByIdForUser(projectId, user);

    return this.taskRepository.getTasksByProjectId(projectId);
  }

  async getTasksByProjectIdWithRelations(
    projectId: string,
    user: User,
  ): Promise<Task[]> {
    // check if projectId exists and is related to authenticated user
    await this.projectsService.getProjectByIdForUser(projectId, user);

    return this.taskRepository.getTasksByProjectIdWithRelations(projectId);
  }

  async createTaskForUser(createTaskDto: CreateTaskDto, user: User) {
    // check if projectId exists and is related to authenticated user
    await this.projectsService.getProjectByIdForUser(
      createTaskDto.projectId,
      user,
    );

    return this.taskRepository.createTask(createTaskDto);
  }

  async updateTask(id: string, updateTaskDto: UpdateTaskDto): Promise<Task> {
    const found = await this.taskRepository.findOne({
      id,
      ownerId: updateTaskDto.ownerId,
    });

    if (!found) {
      this.logger.verbose(
        `The task with id "${id}" not found for owner id: "${updateTaskDto.ownerId}".`,
      );

      throw new NotFoundException();
    }

    if (found.completedAt) {
      this.logger.verbose(
        `The task with id "${id}" has the status set to "DONE. Update title and/or description is not possible ": "${updateTaskDto.ownerId}".`,
      );

      throw new BadRequestException();
    }

    return await this.taskRepository.updateTask(id, updateTaskDto);
  }

  async updateStatusTask(
    id: string,
    statusTaskDto: StatusTaskDto,
    user: User,
  ): Promise<Task> {
    const found = await this.taskRepository.findOne({
      id,
    });

    if (!found) {
      this.logger.verbose(`Task with id "${id}" not found.`);

      throw new NotFoundException();
    }

    // check if projectId exists and is related to authenticated user
    await this.projectsService.getProjectByIdForUser(found.projectId, user);

    return await this.taskRepository.updateStatusTask(found, statusTaskDto);
  }

  async deleteTask(id: string, user: User): Promise<{ total: number }> {
    const result = await this.taskRepository.delete({
      id,
      ownerId: user.id,
    });

    if (result.affected === 0) {
      this.logger.error(`Failed to delete task with id: "${id}".`);

      throw new NotFoundException();
    }

    return {
      total: result.affected,
    };
  }
}
