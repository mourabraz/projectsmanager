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

import { GetUser } from '../auth/get-user.decorator';
import { User } from '../users/user.entity';
import { StepsService } from './steps.service';
import { Step } from './step.entity';
import { CreateStepDto } from './dto/create-step.dto';

@Controller('/tasks/:taskId/steps')
@UseGuards(AuthGuard())
export class TasksStepsController {
  private logger = new Logger(TasksStepsController.name);

  constructor(private stepsService: StepsService) {}

  @Get()
  index(
    @Param('taskId', new ParseUUIDPipe()) taskId: string,
    @GetUser() user: User,
  ): Promise<Step[]> {
    this.logger.verbose(
      `User "${user.email}" retrieving all steps for task id ${taskId}.`,
    );

    return this.stepsService.getStepsByTaskIdWithRelations(taskId, user);
  }

  @Post()
  @UsePipes(ValidationPipe)
  store(
    @Param('taskId', new ParseUUIDPipe()) taskId: string,
    @Body() createStepDto: CreateStepDto,
    @GetUser() user: User,
  ): Promise<Step> {
    this.logger.verbose(
      `User "${
        user.email
      }" creating a new step in task id: "${taskId}". Data: ${JSON.stringify(
        createStepDto,
      )}`,
    );

    createStepDto.taskId = taskId;
    createStepDto.ownerId = user.id;

    return this.stepsService.createStepForUser(createStepDto, user);
  }
}
