import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HandlebarsAdapter, MailerModule } from '@nestjs-modules/mailer';

import { AppConfigModule } from './config/app/config.module';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { GroupsModule } from './groups/groups.module';
import { ProjectsModule } from './projects/projects.module';
import { TasksModule } from './tasks/tasks.module';
import { FiilesModule } from './fiiles/fiiles.module';
import { PostgresConfigService } from './config/database/postgres/config.service';
import { PostgresConfigModule } from './config/database/postgres/config.module';
import { UsersGroupsModule } from './users-groups/users-groups.module';
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
    MailerModule.forRootAsync({
      useFactory: () => ({
        transport: {
          host: 'smtp.mailtrap.io',
          port: 2525,
          secure: false, // upgrade later with STARTTLS
          auth: {
            user: '38b296b17255a2',
            pass: '5d9bd1f573e028',
          },
        },
        defaults: {
          from: '"nest-modules" <modules@nestjs.com>',
        },
        template: {
          dir: __dirname + '/templates',
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
    }),
    AuthModule,
    UsersModule,
    GroupsModule,
    ProjectsModule,
    TasksModule,
    FiilesModule,
    UsersGroupsModule,
    InvitationsModule,
  ],
})
export class AppModule {}
