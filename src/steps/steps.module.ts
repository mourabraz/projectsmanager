import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { StepsController } from './steps.controller';
import { StepsService } from './steps.service';
import { StepRepository } from './step.repository';
import { AuthModule } from '../auth/auth.module';
import { TasksModule } from '../tasks/tasks.module';
import { UsersModule } from '../users/users.module';
import { TasksStepsController } from './tasks-steps.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([StepRepository]),
    AuthModule,
    UsersModule,
    TasksModule,
  ],
  providers: [StepsService],
  controllers: [StepsController, TasksStepsController],
})
export class StepsModule {}
