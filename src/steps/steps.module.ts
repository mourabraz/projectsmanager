import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { StepsController } from './steps.controller';
import { StepsService } from './steps.service';
import { StepRepository } from './step.repository';

@Module({
  imports: [TypeOrmModule.forFeature([StepRepository])],
  controllers: [StepsController],
  providers: [StepsService],
})
export class StepsModule {}
