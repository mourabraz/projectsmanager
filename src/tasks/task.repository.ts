import { Repository, EntityRepository } from 'typeorm';
import { Logger, InternalServerErrorException } from '@nestjs/common';
import { parseISO } from 'date-fns';

import { Task } from './task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { StatusTaskDto } from './dto/status-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskStatus } from './task-status.enum';
import { User } from '../users/user.entity';
import {
  transformFlatToNest,
  QueryAsObject,
  concatResultOfOneToMany,
} from '../util/postgres-query-wrap/query-as-object';

@EntityRepository(Task)
export class TaskRepository extends Repository<Task> {
  private logger = new Logger(TaskRepository.name);

  async getTaskByIdForUser(id: string, user: User): Promise<Task> {
    try {
      const tasks = await this.query(
        `SELECT tasks.id FROM tasks
      INNER JOIN projects ON projects.id = tasks.project_id 
      INNER JOIN users_projects ON users_projects.project_id = projects.id
      INNER JOIN users ON users_projects.user_id = users.id
      WHERE users.id = $1 AND tasks.id = $2 LIMIT 1`,
        [user.id, id],
      );

      return tasks[0];
    } catch (error) {
      this.logger.error(
        `Failed to get task with id: "${id}" for user "${user.email}".`,
        error.stack,
      );

      throw new InternalServerErrorException();
    }
  }

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
      // const result = this.createQueryBuilder('tasks')
      //   .where({ projectId })
      //   .select([
      //     'tasks.id',
      //     'tasks.title',
      //     'tasks.order',
      //     'tasks.description',
      //     'tasks.startedAt',
      //     'tasks.completedAt',
      //     'tasks.status',
      //     'tasks.projectId',
      //     'tasks.ownerId',
      //     'tasks.createdAt',
      //     'tasks.updatedAt',
      //     'owner.id',
      //     'owner.name',
      //     'owner.email',
      //     'photo.filename',
      //   ])
      //   .leftJoin('tasks.owner', 'owner')
      //   .leftJoin('owner.photo', 'photo')
      //   .getMany();
      const [qs, qp] = new QueryAsObject(
        {
          table: 'tasks',
          select: `id, title, order, description, started_at, completed_at, 
          status, project_id, created_at, updated_at, deadline_at`,
          where: 'project_id = :projectId',
          order: [['order', 'ASC']],

          includes: [
            {
              table: 'users',
              select: 'id, name, email',
              as: 'owner',
              localKey: 'id',
              targetKey: 'user_id',
              includes: [
                {
                  table: 'photos',
                  virtual: {
                    field: 'url',
                    execute:
                      "CONCAT('http://192.168.8.102:8080/users/photo/', filename)",
                  },
                  as: 'photo',
                  select: 'filename, user_id, id, url',
                  localKey: 'user_id',
                  targetKey: 'id',
                },
              ],
            },
            {
              table: 'fiiles',
              virtual: {
                field: 'url',
                execute: "CONCAT('http://192.168.8.102:8080/files/', path)",
              },
              select: 'id, name, type, path, size, user_id, task_id, url',
              localKey: 'task_id',
              targetKey: 'id',
            },
          ],
        },
        { projectId },
      ).getQuery();

      const result = await this.query(qs, qp);

      const res = concatResultOfOneToMany(transformFlatToNest(result), {
        field: 'fiiles',
      });

      return res;
    } catch (error) {
      this.logger.error(
        `Failed to get tasks for project id "${projectId}".`,
        error.stack,
      );

      throw new InternalServerErrorException();
    }
  }

  async getTaskByIdWithRelations(taskId: string): Promise<Task> {
    // const result = this.createQueryBuilder('tasks')
    //   .where({ id: taskId })
    //   .select([
    //     'tasks.id',
    //     'tasks.title',
    //     'tasks.order',
    //     'tasks.description',
    //     'tasks.startedAt',
    //     'tasks.completedAt',
    //     'tasks.status',
    //     'tasks.projectId',
    //     'tasks.ownerId',
    //     'tasks.createdAt',
    //     'tasks.updatedAt',
    //     'owner.id',
    //     'owner.name',
    //     'owner.email',
    //     'photo.filename',
    //   ])
    //   .leftJoin('tasks.owner', 'owner')
    //   .leftJoin('owner.photo', 'photo')
    //   .leftJoin('tasks.fiiles', 'fiiles')
    //   .getOne();
    const [qs, qp] = new QueryAsObject(
      {
        table: 'tasks',
        select: `id, title, order, description, started_at, completed_at, 
        status, project_id, created_at, updated_at, deadline_at`,
        where: 'id = :taskId',

        includes: [
          {
            table: 'users',
            select: 'id, name, email',
            as: 'owner',
            localKey: 'id',
            targetKey: 'user_id',
            includes: [
              {
                table: 'photos',
                virtual: {
                  field: 'url',
                  execute:
                    "CONCAT('http://192.168.8.102:8080/users/photo/', filename)",
                },
                as: 'photo',
                select: 'filename, user_id, id, url',
                localKey: 'user_id',
                targetKey: 'id',
              },
            ],
          },
          {
            table: 'fiiles',
            virtual: {
              field: 'url',
              execute: "CONCAT('http://192.168.8.102:8080/files/', path)",
            },
            select: 'id, name, type, path, size, user_id, task_id, url',
            localKey: 'task_id',
            targetKey: 'id',
          },
        ],
      },
      { taskId },
    ).getQuery();

    const result = await this.query(qs, qp);

    const res = concatResultOfOneToMany(transformFlatToNest(result), {
      field: 'fiiles',
    });

    return res && res[0] ? res[0] : [];
  }

  async createTask(createTaskDto: CreateTaskDto): Promise<Task> {
    try {
      const {
        title,
        description,
        projectId,
        ownerId,
        deadlineAt,
        startedAt,
      } = createTaskDto;

      console.log(createTaskDto);

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
      task.deadlineAt = deadlineAt ? parseISO(deadlineAt) : null;
      task.startedAt = startedAt ? parseISO(startedAt) : null;

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

  async updateTask(id: string, updateTaskDto: UpdateTaskDto): Promise<Task> {
    try {
      const updateTask = {
        ...updateTaskDto,
        ...(updateTaskDto.deadlineAt && updateTaskDto.deadlineAt === 'null'
          ? { deadlineAt: null }
          : {}),
        ...(updateTaskDto.startedAt && updateTaskDto.startedAt === 'null'
          ? { startedAt: null }
          : {}),
      };
      delete updateTask.ownerId;

      await this.update(id, updateTask);

      return this.getTaskByIdWithRelations(id);
    } catch (error) {
      this.logger.error(
        `Failed to update task with id: "${id}". Data: ${JSON.stringify(
          updateTaskDto,
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

        if (task.status === 'OPEN' && statusTaskDto.status === 'IN_PROGRESS') {
          task.startedAt = new Date();
        }

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
