import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UsersProjectsService } from './users-projects.service';
import { UserProjectRepository } from './user-project.repository';

@Module({
  imports: [TypeOrmModule.forFeature([UserProjectRepository])],
  providers: [UsersProjectsService],
  exports: [UsersProjectsService],
})
export class UsersProjectsModule {}
