import { resolve } from 'path';
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { HandlebarsAdapter, MailerModule } from '@nestjs-modules/mailer';

import { EmailConfigModule } from '../config/email/config.module';
import { EmailConfigService } from '../config/email/config.service';
import { EmailProcessor } from './email.processor';
import { EmailsService } from './emails.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'emails',
      redis: {
        host: 'localhost',
        port: 6379,
      },
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
  ],
  providers: [EmailsService, EmailProcessor],
  exports: [EmailsService],
})
export class QueueModule {
  onModuleInit() {
    console.log('QueueModule ', process.pid);
  }
}

// async function bootstrap() {
//   const app = await NestFactory.create(QueueModule);

//   await app.init();
// }

// bootstrap();
