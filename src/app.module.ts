import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppConfigModule } from './config/app/config.module';
import { AppConfigService } from './config/app/config.service';
import { PostgresConfigModule } from './config/database/postgres/config.module';
import { PostgresConfigService } from './config/database/postgres/config.service';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProjectsModule } from './projects/projects.module';
import { TasksModule } from './tasks/tasks.module';
import { StepsModule } from './steps/steps.module';
import { FiilesModule } from './fiiles/fiiles.module';
import { UsersProjectsModule } from './users-projects/users-projects.module';
import { InvitationsModule } from './invitations/invitations.module';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [PostgresConfigModule, AppConfigModule],
      useFactory: async (
        configPostgresService: PostgresConfigService,
        configAppService: AppConfigService,
      ) =>
        configPostgresService[
          configAppService.env === 'development'
            ? 'typeOrmConfigDevelopment'
            : 'typeOrmConfig'
        ],
      inject: [PostgresConfigService, AppConfigService],
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
export class AppModule {
  // onModuleInit() {
  //   console.log('AppModule ', process.env.NODE_ENV);
  // }
}
