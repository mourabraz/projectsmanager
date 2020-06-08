import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';

import { MulterConfigModule } from '../config/multer/config.module';
import { MulterConfigService } from '../config/multer/config.service';
import { AppConfigModule } from '../config/app/config.module';
import { AuthModule } from '../auth/auth.module';

import { FiileRepository } from './fiile.repository';
import { FiilesService } from './fiiles.service';
import { FiilesController } from './fiiles.controller';
import { TasksModule } from '../tasks/tasks.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([FiileRepository]),
    MulterModule.registerAsync({
      imports: [MulterConfigModule],
      useFactory: async (configService: MulterConfigService) =>
        configService.multerFileConfig,
      inject: [MulterConfigService],
    }),
    AppConfigModule,
    MulterConfigModule,
    AuthModule,
    TasksModule,
  ],
  providers: [FiilesService],
  exports: [FiilesService],
  controllers: [FiilesController],
})
export class FiilesModule {}
