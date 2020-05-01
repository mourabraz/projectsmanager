import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { ProjectRepository } from './project.repository';
import { AuthModule } from 'src/auth/auth.module';
import { UsersModule } from 'src/users/users.module';
import { GroupsModule } from 'src/groups/groups.module';
import { GroupsProjectsController } from './groups-projects.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProjectRepository]),
    AuthModule,
    UsersModule,
    GroupsModule,
  ],
  providers: [ProjectsService],
  controllers: [ProjectsController, GroupsProjectsController],
})
export class ProjectsModule {}
