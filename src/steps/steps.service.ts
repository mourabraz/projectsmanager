import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { StepRepository } from './step.repository';

import { User } from '../users/user.entity';
import { Step } from './step.entity';
import { CreateStepDto } from './dto/create-step.dto';
import { TasksService } from '../tasks/tasks.service';

@Injectable()
export class StepsService {
  private logger = new Logger(StepsService.name);

  constructor(
    @InjectRepository(StepRepository)
    private stepRepository: StepRepository,
    private tasksService: TasksService,
  ) {}

  async getStepsByTaskId(taskId: string, user: User): Promise<Step[]> {
    // check if taskId exists and is related to authenticated user
    await this.tasksService.getTaskByIdForUser(taskId, user);

    return this.stepRepository.getStepsByTaskId(taskId);
  }

  async getStepsByTaskIdWithRelations(
    taskId: string,
    user: User,
  ): Promise<Step[]> {
    // check if taskId exists and is related to authenticated user
    await this.tasksService.getTaskByIdForUser(taskId, user);

    return this.stepRepository.getStepsByTaskId(taskId);
  }

  async createStepForUser(createStepDto: CreateStepDto, user: User) {
    // check if taskId exists and is related to authenticated user
    await this.tasksService.getTaskByIdForUser(createStepDto.taskId, user);

    return this.stepRepository.createStep(createStepDto);
  }

  async updateStep(id: string, createStepDto: CreateStepDto): Promise<Step> {
    const found = await this.stepRepository.findOne({
      id,
      ownerId: createStepDto.ownerId,
    });

    if (!found) {
      this.logger.verbose(
        `The Step with id "${id}" not found for owner id: "${createStepDto.ownerId}".`,
      );

      throw new NotFoundException();
    }

    return await this.stepRepository.updateStep(id, createStepDto);
  }

  async updateCompletedAtStep(id: string, user: User): Promise<Step> {
    const found = await this.stepRepository.findOne(id);

    if (!found) {
      this.logger.verbose(`Step with id "${id}" not found.`);

      throw new NotFoundException();
    }

    // check if taskId exists and is related to authenticated user
    await this.tasksService.getTaskByIdForUser(found.taskId, user);

    return await this.stepRepository.updateCompletedAtStep(found);
  }

  async updateOrderStep(id: string, order: number, user: User): Promise<Step> {
    const found = await this.stepRepository.findOne({
      id,
    });

    if (!found) {
      this.logger.verbose(`Step with id "${id}" not found.`);

      throw new NotFoundException();
    }

    // check if taskId exists and is related to authenticated user
    await this.tasksService.getTaskByIdForUser(found.taskId, user);

    return await this.stepRepository.updateOrderStep(found, order);
  }

  async deleteStep(id: string, user: User): Promise<{ total: number }> {
    const result = await this.stepRepository.delete({
      id,
      ownerId: user.id,
    });

    if (result.affected === 0) {
      this.logger.error(`Failed to delete step with id: "${id}".`);

      throw new NotFoundException();
    }

    return {
      total: result.affected,
    };
  }
}
