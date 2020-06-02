import {
  Controller,
  UseGuards,
  Logger,
  Post,
  UsePipes,
  ValidationPipe,
  Body,
  Get,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { GetUser } from '../auth/get-user.decorator';
import { User } from '../users/user.entity';
import { Task } from './task.entity';

@Controller('/projects/:projectId/tasks')
@UseGuards(AuthGuard())
export class ProjectsTasksController {
  private logger = new Logger(ProjectsTasksController.name);

  constructor(private tasksService: TasksService) {}

  @Get()
  index(
    @Param('projectId', new ParseUUIDPipe()) projectId: string,
    @GetUser() user: User,
  ): Promise<Task[]> {
    this.logger.verbose(`User "${user.email}" retrieving all tasks.`);

    return this.tasksService.getTasksByProjectIdWithRelations(projectId, user);
  }

  @Post()
  @UsePipes(new ValidationPipe({ transform: true }))
  store(
    @Param('projectId', new ParseUUIDPipe()) projectId: string,
    @Body() createTaskDto: CreateTaskDto,
    @GetUser() user: User,
  ): Promise<Task> {
    this.logger.verbose(
      `User "${
        user.email
      }" creating a new task in project id: "${projectId}". Data: ${JSON.stringify(
        createTaskDto,
      )}`,
    );

    createTaskDto.projectId = projectId;
    createTaskDto.ownerId = user.id;

    return this.tasksService.createTaskForUser(createTaskDto, user);
  }
}
