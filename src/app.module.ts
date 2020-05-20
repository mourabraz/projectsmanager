import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppConfigModule } from './config/app/config.module';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProjectsModule } from './projects/projects.module';
import { TasksModule } from './tasks/tasks.module';
import { StepsModule } from './steps/steps.module';
import { FiilesModule } from './fiiles/fiiles.module';
import { PostgresConfigService } from './config/database/postgres/config.service';
import { PostgresConfigModule } from './config/database/postgres/config.module';
import { UsersProjectsModule } from './users-projects/users-projects.module';
import { InvitationsModule } from './invitations/invitations.module';

@Module({
  imports: [
    AppConfigModule,
    TypeOrmModule.forRootAsync({
      imports: [PostgresConfigModule],
      useFactory: async (configService: PostgresConfigService) =>
        configService.typeOrmConfig,
      inject: [PostgresConfigService],
    }),
    AuthModule,
    UsersModule,
    ProjectsModule,
    TasksModule,
    StepsModule,
    FiilesModule,
    UsersProjectsModule,
    InvitationsModule,
  ],
})
export class AppModule {}
