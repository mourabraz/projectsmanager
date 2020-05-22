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
        DB_TYPE_TEST: Joi.string().default('mysql'),
        DB_HOST_TEST: Joi.string().default('127.0.0.1'),
        DB_PORT_TEST: Joi.string().default('3306'),
        DB_USERNAME_TEST: Joi.string().default('mysql'),
        DB_PASSWORD_TEST: Joi.string().default('mysql'),
        DB_NAME_TEST: Joi.string().default('mysql_tests'),
        TYPEORM_SYNC_TEST: Joi.boolean().default(true),
        DB_HOST_DEVELOPMENT: Joi.string().default('127.0.0.1'),
        DB_PORT_DEVELOPMENT: Joi.string().default('3306'),
        DB_USERNAME_DEVELOPMENT: Joi.string().default('mysql'),
        DB_PASSWORD_DEVELOPMENT: Joi.string().default('mysql'),
        DB_NAME_DEVELOPMENT: Joi.string().default('mysql_development'),
        TYPEORM_SYNC_DEVELOPMENT: Joi.boolean().default(true),
      }),
    }),
  ],
  providers: [ConfigService, PostgresConfigService],
  exports: [ConfigService, PostgresConfigService],
})
export class PostgresConfigModule {}
