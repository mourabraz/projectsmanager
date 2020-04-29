import * as Joi from '@hapi/joi';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import configuration from './configuration';
import { PostgresConfigService } from './config.service';

/**
 * Import and provide app configuration related classes.
 *
 * @module
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      validationSchema: Joi.object({
        DB_TYPE: Joi.string().default('mysql'),
        DB_HOST: Joi.string().default('127.0.0.1'),
        DB_PORT: Joi.string().default('3306'),
        DB_USERNAME: Joi.string().default('mysql'),
        DB_PASSWORD: Joi.string().default('mysql'),
        DB_NAME: Joi.string().default('mysql'),
        TYPEORM_SYNC: Joi.boolean().default(false),
      }),
    }),
  ],
  providers: [ConfigService, PostgresConfigService],
  exports: [ConfigService, PostgresConfigService],
})
export class PostgresConfigModule {}
