import {
  Controller,
  UseGuards,
  Logger,
  Put,
  ValidationPipe,
  UsePipes,
  Param,
  ParseUUIDPipe,
  Body,
  Patch,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { StepsService } from './steps.service';
import { CreateStepDto } from './dto/create-step.dto';
import { GetUser } from '../auth/get-user.decorator';
import { User } from '../users/user.entity';
import { Step } from './step.entity';

@Controller('steps')
@UseGuards(AuthGuard())
export class StepsController {
  private logger = new Logger(StepsController.name);

  constructor(private stepsService: StepsService) {}

  @Put('/:id')
  @UsePipes(ValidationPipe)
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() createStepDto: CreateStepDto,
    @GetUser() user: User,
  ): Promise<Step> {
    this.logger.verbose(
      `User "${user.email}" update step id: "${id}". Data: ${JSON.stringify(
        createStepDto,
      )}`,
    );

    createStepDto.ownerId = user.id;

    return this.stepsService.updateStep(id, createStepDto);
  }

  @Patch('/:id/completedat')
  @UsePipes(ValidationPipe)
  updateCompletedAt(
    @Param('id', new ParseUUIDPipe()) id: string,
    @GetUser() user: User,
  ): Promise<Step> {
    this.logger.verbose(
      `User "${user.email}" update step\'s completedAt with id: "${id}".`,
    );

    return this.stepsService.updateCompletedAtStep(id, user);
  }

  @Patch('/:id/order/:order')
  @UsePipes(ValidationPipe)
  updateOrder(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('order', new ParseIntPipe()) order: number,
    @GetUser() user: User,
  ): Promise<Step> {
    this.logger.verbose(
      `User "${user.email}" update step\'s order with id: "${id}".`,
    );

    return this.stepsService.updateOrderStep(id, order, user);
  }

  @Delete('/:id')
  destroy(
    @Param('id', new ParseUUIDPipe()) id: string,
    @GetUser() user: User,
  ): Promise<{ total: number }> {
    this.logger.verbose(`User "${user.email}" delete step id: "${id}".`);

    return this.stepsService.deleteStep(id, user);
  }
}
