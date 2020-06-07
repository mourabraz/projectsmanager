import { Repository, EntityRepository } from 'typeorm';
import { Logger, InternalServerErrorException } from '@nestjs/common';

import { Step } from './step.entity';
import { User } from '../users/user.entity';
import { CreateStepDto } from './dto/create-step.dto';

@EntityRepository(Step)
export class StepRepository extends Repository<Step> {
  private logger = new Logger(StepRepository.name);

  async getStepByIdForUser(id: string, user: User): Promise<Step> {
    try {
      const steps = await this.query(
        `SELECT * FROM steps
      INNER JOIN steps ON tasks.id = steps.task_id
      INNER JOIN projects ON projects.id = tasks.project_id 
      INNER JOIN users_projects ON users_projects.project_id = projects.id
      INNER JOIN users ON users_projects.user_id = users.id
      WHERE users.id = $1 AND steps.id = $2 LIMIT 1`,
        [user.id, id],
      );

      return steps[0];
    } catch (error) {
      this.logger.error(
        `Failed to get step with id: "${id}" for user "${user.email}".`,
        error.stack,
      );

      throw new InternalServerErrorException();
    }
  }

  async getStepsByTaskId(taskId: string): Promise<Step[]> {
    try {
      return await this.find({
        where: { taskId },
        order: { order: 'ASC' },
      });
    } catch (error) {
      this.logger.error(
        `Failed to get steps for task id "${taskId}".`,
        error.stack,
      );

      throw new InternalServerErrorException();
    }
  }

  async createStep(createStepDto: CreateStepDto): Promise<Step> {
    try {
      const { title, description = '', taskId, ownerId } = createStepDto;

      const oldSteps = await this.find({
        where: { taskId },
        order: { order: 'DESC' },
      });

      const order = oldSteps && oldSteps[0] ? oldSteps[0].order + 1 : 1;

      const step = new Step();
      step.taskId = taskId;
      step.ownerId = ownerId;
      step.title = title;
      step.description = description;
      step.order = order;

      await this.save(step);

      return step;
    } catch (error) {
      this.logger.error(
        `Failed to create step for task. Data: ${JSON.stringify(
          createStepDto,
        )}`,
        error.stack,
      );

      throw new InternalServerErrorException();
    }
  }

  async updateStep(id: string, createStepDto: CreateStepDto): Promise<Step> {
    try {
      await this.update(id, {
        title: createStepDto.title,
        description: createStepDto.description,
      });

      return this.findOne(id);
    } catch (error) {
      this.logger.error(
        `Failed to update step with id: "${id}". Data: ${JSON.stringify(
          createStepDto,
        )}`,
        error.stack,
      );

      throw new InternalServerErrorException();
    }
  }

  async updateCompletedAtStep(step: Step): Promise<Step> {
    try {
      await this.update(step.id, {
        completedAt: step.completedAt ? null : new Date(),
      });

      return this.findOne(step.id);
    } catch (error) {
      this.logger.error(
        `Failed to update step\'s completedAt with id: "${step.id}".`,
        error.stack,
      );

      throw new InternalServerErrorException();
    }
  }

  async updateOrderStep(step: Step, order: number): Promise<Step> {
    try {
      let oldStepList = await this.find({
        where: { taskId: step.taskId },
        order: { order: 'ASC' },
      });

      const startIndex = oldStepList.findIndex((s) => s.id === step.id);
      const endIndex = order;

      const [removed] = oldStepList.splice(startIndex, 1);
      oldStepList.splice(endIndex, 0, removed);

      // eslint-disable-next-line no-param-reassign
      oldStepList = oldStepList.map((item, _index) => ({
        ...item,
        order: _index + 1,
      }));

      await this.save(oldStepList);

      return await this.findOne(step.id);
    } catch (error) {
      this.logger.error(
        `Failed to update step\'s order with id: "${step.id}".`,
        error.stack,
      );

      throw new InternalServerErrorException();
    }
  }
}
