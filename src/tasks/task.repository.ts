import { Repository, EntityRepository } from 'typeorm';
import { Logger, InternalServerErrorException } from '@nestjs/common';

import { Task } from './task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { StatusTaskDto } from './dto/status-task.dto';
import { TaskStatus } from './task-status.enum';

@EntityRepository(Task)
export class TaskRepository extends Repository<Task> {
  private logger = new Logger(TaskRepository.name);

  async getTasksByProjectId(projectId: string): Promise<Task[]> {
    try {
      return await this.find({ where: { projectId } });
    } catch (error) {
      this.logger.error(
        `Failed to get tasks for project id "${projectId}".`,
        error.stack,
      );

      throw new InternalServerErrorException();
    }
  }

  async createTask(createTaskDto: CreateTaskDto): Promise<Task> {
    try {
      const { title, description, projectId, ownerId } = createTaskDto;

      const openTasks = await this.find({
        where: { projectId, status: 'OPEN' },
        order: { order: 'DESC' },
      });

      const order = openTasks && openTasks[0] ? openTasks[0].order + 1 : 1;

      const task = new Task();
      task.projectId = projectId;
      task.ownerId = ownerId;
      task.title = title;
      task.description = description;
      task.status = TaskStatus.OPEN;
      task.order = order;

      await this.save(task);

      return task;
    } catch (error) {
      this.logger.error(
        `Failed to create task for project. Data: ${JSON.stringify(
          createTaskDto,
        )}`,
        error.stack,
      );

      throw new InternalServerErrorException();
    }
  }

  async updateTask(id: string, createTaskDto: CreateTaskDto): Promise<Task> {
    try {
      await this.update(id, {
        title: createTaskDto.title,
        description: createTaskDto.description,
      });

      return await this.findOne(id);
    } catch (error) {
      this.logger.error(
        `Failed to update task with id: "${id}". Data: ${JSON.stringify(
          createTaskDto,
        )}`,
        error.stack,
      );

      throw new InternalServerErrorException();
    }
  }

  async updateStatusTask(
    id: string,
    statusTaskDto: StatusTaskDto,
  ): Promise<Task> {
    try {
      const task = await this.findOne(id);
      const openTasks = await this.find({
        where: { projectId: task.projectId, status: statusTaskDto.status },
        order: { order: 'DESC' },
      });

      const order =
        openTasks && openTasks[0]
          ? openTasks[0].order + (statusTaskDto.status === 'OPEN' ? 1 : 0)
          : 1;

      await this.update(id, {
        status: statusTaskDto.status,
        order: order,
      });

      return await this.findOne(id);
    } catch (error) {
      this.logger.error(
        `Failed to update task with id: "${id}". Data: ${JSON.stringify(
          statusTaskDto,
        )}`,
        error.stack,
      );

      throw new InternalServerErrorException();
    }
  }
}
