import { resolve } from 'path';
import { Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';

import { EmailConfigModule } from '../config/email/config.module';
import { EmailConfigService } from '../config/email/config.service';

import { EmailConsumer } from './email.consumer';
import { EventGateway } from './event.gateway';
import { RedisReusableConnection } from './redis-reusable-connection';
import { RedisIoAdapter } from './redis-io-adapter';

@Module({
  imports: [
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
          dir: resolve(__dirname, '..', 'views', 'emails'),
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
        options: {
          partials: {
            dir: resolve(__dirname, '..', 'views', 'emails', 'partials'),
            options: {
              strict: true,
            },
          },
        },
      }),
      inject: [EmailConfigService],
    }),
  ],
  providers: [RedisReusableConnection, EmailConsumer, EventGateway],
})
export class QueueModule {
  onModuleInit() {
    console.log('QueueModule ', process.pid);
  }
}

async function bootstrap() {
  const app = await NestFactory.create(QueueModule);
  app.useWebSocketAdapter(new RedisIoAdapter(app));
  await app.init();
}

bootstrap();
