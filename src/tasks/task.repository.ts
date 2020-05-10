import { Repository, EntityRepository } from 'typeorm';
import { Task } from './task.entity';
//import { CreateTaskDto } from './dto/create-task.dto';

import { Logger } from '@nestjs/common';

@EntityRepository(Task)
export class TaskRepository extends Repository<Task> {
  private logger = new Logger(TaskRepository.name);

  // async getTasks(filterDto: GetTasksFilterDto, user: User): Promise<Task[]> {
  //   const { status, search } = filterDto;
  //   const query = this.createQueryBuilder('task');
  //   query.where('task.userId = :userId', { userId: user.id });

  //   if (status) {
  //     query.andWhere('task.status = :status', { status });
  //   }

  //   if (search) {
  //     query.andWhere(
  //       '(task.title LIKE :search OR task.description LIKE :search)',
  //       { search: `%${search}%` },
  //     );
  //   }

  //   try {
  //     const tasks = await query.getMany();
  //     return tasks;
  //   } catch (error) {
  //     this.logger.error(
  //       `Failed to get tasks for user "${
  //         user.username
  //       }". Filters: ${JSON.stringify(filterDto)}`,
  //       error.stack,
  //     );
  //     throw new InternalServerErrorException();
  //   }
  // }

  // async createTask(createTaskDto: CreateTaskDto, user: User): Promise<Task> {
  //   const { title, description } = createTaskDto;

  //   const task = new Task();
  //   task.user = user;
  //   task.title = title;
  //   task.description = description;
  //   task.status = TaskStatus.OPEN;

  //   try {
  //     await task.save();
  //     delete task.user;
  //     return task;
  //   } catch (error) {
  //     this.logger.error(
  //       `Failed to create task for user "${
  //         user.username
  //       }". Data: ${JSON.stringify(createTaskDto)}`,
  //       error.stack,
  //     );
  //     throw new InternalServerErrorException();
  //   }
  // }
}
