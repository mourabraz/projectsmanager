import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppConfigModule } from './config/app/config.module';
import { typeOrmConfig } from './config/typeorm.config';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { GroupsModule } from './groups/groups.module';
import { ProjectsModule } from './projects/projects.module';
import { TasksModule } from './tasks/tasks.module';
import { FiilesModule } from './fiiles/fiiles.module';

@Module({
  imports: [
    AppConfigModule,
    TypeOrmModule.forRoot(typeOrmConfig),
    AuthModule,
    UsersModule,
    GroupsModule,
    ProjectsModule,
    TasksModule,
    FiilesModule,
  ],
})
export class AppModule {}
