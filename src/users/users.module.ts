import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';

import { MulterConfigModule } from '../config/multer/config.module';
import { MulterConfigService } from '../config/multer/config.service';

import { UserRepository } from './user.repository';
import { UsersService } from './users.service';
import { GroupsModule } from '../groups/groups.module';
import { UsersController } from './users.controller';
import { AuthModule } from '../auth/auth.module';
import { UsersPhotosController } from './users-photos.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserRepository]),
    MulterModule.registerAsync({
      imports: [MulterConfigModule],
      useFactory: async (configService: MulterConfigService) =>
        configService.multerConfig,
      inject: [MulterConfigService],
    }),
    AuthModule,
    GroupsModule,
  ],
  providers: [UsersService],
  exports: [UsersService],
  controllers: [UsersController, UsersPhotosController],
})
export class UsersModule {}
