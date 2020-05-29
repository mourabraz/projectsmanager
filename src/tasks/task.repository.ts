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
      return await this.find({
        where: { projectId },
        order: { order: 'ASC' },
      });
    } catch (error) {
      this.logger.error(
        `Failed to get tasks for project id "${projectId}".`,
        error.stack,
      );

      throw new InternalServerErrorException();
    }
  }

  async getTasksByProjectIdWithRelations(projectId: string): Promise<Task[]> {
    try {
      const result = this.createQueryBuilder('tasks')
        .where({ projectId })
        .select([
          'tasks.id',
          'tasks.title',
          'tasks.order',
          'tasks.description',
          'tasks.startedAt',
          'tasks.completedAt',
          'tasks.status',
          'tasks.projectId',
          'tasks.ownerId',
          'tasks.createdAt',
          'tasks.updatedAt',
          'owner.id',
          'owner.name',
          'owner.email',
          'photo.filename',
        ])
        .leftJoin('tasks.owner', 'owner')
        .leftJoin('owner.photo', 'photo')
        .getMany();

      return result;
    } catch (error) {
      this.logger.error(
        `Failed to get tasks for project id "${projectId}".`,
        error.stack,
      );

      throw new InternalServerErrorException();
    }
  }

  async getTaskByIdWithRelations(taskId: string): Promise<Task> {
    const result = this.createQueryBuilder('tasks')
      .where({ id: taskId })
      .select([
        'tasks.id',
        'tasks.title',
        'tasks.order',
        'tasks.description',
        'tasks.startedAt',
        'tasks.completedAt',
        'tasks.status',
        'tasks.projectId',
        'tasks.ownerId',
        'tasks.createdAt',
        'tasks.updatedAt',
        'owner.id',
        'owner.name',
        'owner.email',
        'photo.filename',
      ])
      .leftJoin('tasks.owner', 'owner')
      .leftJoin('owner.photo', 'photo')
      .getOne();

    return result;
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

      return this.getTaskByIdWithRelations(task.id);
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

      return this.getTaskByIdWithRelations(id);
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
    task: Task,
    statusTaskDto: StatusTaskDto,
  ): Promise<Task> {
    try {
      let fromTasksList = await this.find({
        where: { projectId: task.projectId, status: task.status },
        order: { order: 'ASC' },
      });

      const startIndexFrom = fromTasksList.findIndex((t) => t.id === task.id);
      const endIndex = statusTaskDto.order - 1;

      if (task.status === statusTaskDto.status) {
        const [removed] = fromTasksList.splice(startIndexFrom, 1);
        fromTasksList.splice(endIndex, 0, removed);

        // eslint-disable-next-line no-param-reassign
        fromTasksList = fromTasksList.map((item, _index) => ({
          ...item,
          order: _index + 1,
        }));
      } else {
        let toTasksList = await this.find({
          where: { projectId: task.projectId, status: statusTaskDto.status },
          order: { order: 'ASC' },
        });

        task.status = statusTaskDto.status;
        task.completedAt =
          statusTaskDto.status === TaskStatus.DONE ? new Date() : null;
        toTasksList.splice(endIndex, 0, task);

        toTasksList = toTasksList.map((item, _index) => ({
          ...item,
          order: _index + 1,
        }));

        fromTasksList.splice(startIndexFrom, 1);

        fromTasksList = fromTasksList.map((item, _index) => ({
          ...item,
          order: _index + 1,
        }));

        await this.save(toTasksList);
      }

      await this.save(fromTasksList);

      return await this.getTaskByIdWithRelations(task.id);
    } catch (error) {
      this.logger.error(
        `Failed to update task with id: "${task.id}". Data: ${JSON.stringify(
          statusTaskDto,
        )}`,
        error.stack,
      );

      throw new InternalServerErrorException();
    }
  }
}
