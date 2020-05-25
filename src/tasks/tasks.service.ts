import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { TaskRepository } from './task.repository';
import { User } from '../users/user.entity';
import { Task } from './task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
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

  async getTasksByProjectId(projectId: string, user: User): Promise<Task[]> {
    // check if projectId exists and is related to authenticated user
    await this.projectsService.getProjectByIdForUser(projectId, user);

    return this.taskRepository.getTasksByProjectId(projectId);
  }

  async createTaskForUser(createTaskDto: CreateTaskDto, user: User) {
    // check if projectId exists and is related to authenticated user
    await this.projectsService.getProjectByIdForUser(
      createTaskDto.projectId,
      user,
    );

    return this.taskRepository.createTask(createTaskDto);
  }

  async updateTask(id: string, createTaskDto: CreateTaskDto): Promise<Task> {
    const found = await this.taskRepository.findOne({
      id,
      ownerId: createTaskDto.ownerId,
    });

    if (!found) {
      this.logger.verbose(
        `Task with id "${id}" not found for owner id: "${createTaskDto.ownerId}".`,
      );

      throw new NotFoundException();
    }

    return await this.taskRepository.updateTask(id, createTaskDto);
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

    return await this.taskRepository.updateStatusTask(id, statusTaskDto);
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
