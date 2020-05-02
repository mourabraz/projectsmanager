import { resolve } from 'path';
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
import { EmailConfigModule } from './config/email/config.module';
import { EmailConfigService } from './config/email/config.service';

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
      imports: [EmailConfigModule],
      useFactory: async (configServide: EmailConfigService) => ({
        transport: {
          host: configServide.host,
          port: configServide.port,
          secure: false,
          auth: {
            user: configServide.user,
            pass: configServide.pass,
          },
        },
        defaults: {
          from: configServide.from,
        },
        template: {
          dir: resolve(__dirname, 'views', 'emails'),
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
        options: {
          partials: {
            dir: resolve(__dirname, 'views', 'emails', 'partials'),
            options: {
              strict: true,
            },
          },
        },
      }),
      inject: [EmailConfigService],
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
export class AppModule {
  onModuleInit() {
    console.log('MAIN ', process.pid);
  }
}
