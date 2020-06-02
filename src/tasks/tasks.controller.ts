import {
  Controller,
  UseGuards,
  Logger,
  UsePipes,
  ValidationPipe,
  Body,
  Param,
  Put,
  Delete,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { StatusTaskDto } from './dto/status-task.dto';
import { GetUser } from '../auth/get-user.decorator';
import { User } from '../users/user.entity';
import { Task } from './task.entity';

@Controller('tasks')
@UseGuards(AuthGuard())
export class TasksController {
  private logger = new Logger(TasksController.name);

  constructor(private tasksService: TasksService) {}

  @Put('/:id')
  @UsePipes(new ValidationPipe({ transform: true }))
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() createTaskDto: CreateTaskDto,
    @GetUser() user: User,
  ): Promise<Task> {
    this.logger.verbose(
      `User "${user.email}" update task id: "${id}". Data: ${JSON.stringify(
        createTaskDto,
      )}`,
    );

    createTaskDto.ownerId = user.id;

    return this.tasksService.updateTask(id, createTaskDto);
  }

  @Put('/:id/statusorder')
  @UsePipes(ValidationPipe)
  updateStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() statusTaskDto: StatusTaskDto,
    @GetUser() user: User,
  ): Promise<Task> {
    this.logger.verbose(
      `User "${
        user.email
      }" update status task id: "${id}". Data: ${JSON.stringify(
        statusTaskDto,
      )}`,
    );

    return this.tasksService.updateStatusTask(id, statusTaskDto, user);
  }

  @Delete('/:id')
  destroy(
    @Param('id', new ParseUUIDPipe()) id: string,
    @GetUser() user: User,
  ): Promise<{ total: number }> {
    this.logger.verbose(`User "${user.email}" delete task id: "${id}".`);

    return this.tasksService.deleteTask(id, user);
  }
}
