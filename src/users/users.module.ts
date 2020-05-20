import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';

import { MulterConfigModule } from '../config/multer/config.module';
import { MulterConfigService } from '../config/multer/config.service';

import { UserRepository } from './user.repository';
import { UsersService } from './users.service';
import { ProjectsModule } from '../projects/projects.module';
import { UsersController } from './users.controller';
import { AuthModule } from '../auth/auth.module';
import { UsersPhotosController } from './users-photos.controller';
import { AppConfigModule } from '../config/app/config.module';
import { PhotoRepository } from './photo.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserRepository, PhotoRepository]),
    MulterModule.registerAsync({
      imports: [MulterConfigModule],
      useFactory: async (configService: MulterConfigService) =>
        configService.multerPhotoConfig,
      inject: [MulterConfigService],
    }),
    AppConfigModule,
    MulterConfigModule,
    AuthModule,
    ProjectsModule,
  ],
  providers: [UsersService],
  exports: [UsersService],
  controllers: [UsersController, UsersPhotosController],
})
export class UsersModule {}
