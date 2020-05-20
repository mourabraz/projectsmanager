import { Repository, EntityRepository } from 'typeorm';
import { Step } from './step.entity';
//import { CreateStepDto } from './dto/create-step.dto';

import { Logger } from '@nestjs/common';

@EntityRepository(Step)
export class StepRepository extends Repository<Step> {
  private logger = new Logger(StepRepository.name);

  // async getSteps(filterDto: GetStepsFilterDto, user: User): Promise<Step[]> {
  //   const { status, search } = filterDto;
  //   const query = this.createQueryBuilder('step');
  //   query.where('step.userId = :userId', { userId: user.id });

  //   if (status) {
  //     query.andWhere('step.status = :status', { status });
  //   }

  //   if (search) {
  //     query.andWhere(
  //       '(step.title LIKE :search OR step.description LIKE :search)',
  //       { search: `%${search}%` },
  //     );
  //   }

  //   try {
  //     const steps = await query.getMany();
  //     return steps;
  //   } catch (error) {
  //     this.logger.error(
  //       `Failed to get steps for user "${
  //         user.username
  //       }". Filters: ${JSON.stringify(filterDto)}`,
  //       error.stack,
  //     );
  //     throw new InternalServerErrorException();
  //   }
  // }

  // async createStep(createStepDto: CreateStepDto, user: User): Promise<Step> {
  //   const { title, description } = createStepDto;

  //   const step = new Step();
  //   step.user = user;
  //   step.title = title;
  //   step.description = description;
  //   step.status = StepStatus.OPEN;

  //   try {
  //     await step.save();
  //     delete step.user;
  //     return step;
  //   } catch (error) {
  //     this.logger.error(
  //       `Failed to create step for user "${
  //         user.username
  //       }". Data: ${JSON.stringify(createStepDto)}`,
  //       error.stack,
  //     );
  //     throw new InternalServerErrorException();
  //   }
  // }
}
