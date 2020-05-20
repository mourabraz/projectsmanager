import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { StepRepository } from './step.repository';

import { User } from '../users/user.entity';
import { Step } from './step.entity';
//import { CreateStepDto } from './dto/create-step.dto';

@Injectable()
export class StepsService {
  private logger = new Logger(StepsService.name);

  constructor(
    @InjectRepository(StepRepository)
    private stepRepository: StepRepository,
  ) {}

  async getStepById(id: number, user: User): Promise<Step> {
    const found = await this.stepRepository.findOne({
      where: { id, userId: user.id },
    });

    if (!found) {
      this.logger.verbose(
        `Step with id "${id}" not found for owner id: "${user.id}".`,
      );

      throw new NotFoundException();
    }

    return found;
  }

  // async createStep(createStepDto: CreateStepDto, user: User): Promise<Step> {
  //   return this.stepRepository.createStep(createStepDto, user);
  // }
}
