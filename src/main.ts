import { NestFactory } from '@nestjs/core';
import { RedisIoAdapter } from './queue/redis-io-adapter';
import { AppModule } from './app.module';

import { AppConfigService } from './config/app/config.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const appConfig: AppConfigService = app.get('AppConfigService');

  app.useWebSocketAdapter(new RedisIoAdapter(app));

  await app.listen(appConfig.port);
}
bootstrap();
