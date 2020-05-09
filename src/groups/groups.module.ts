import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { GroupsService } from './groups.service';
import { GroupsController } from './groups.controller';
import { GroupRepository } from './group.repository';
import { AuthModule } from '../auth/auth.module';
import { UsersGroupsModule } from '../users-groups/users-groups.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([GroupRepository]),
    AuthModule,
    UsersGroupsModule,
  ],
  providers: [GroupsService],
  controllers: [GroupsController],
  exports: [GroupsService],
})
export class GroupsModule {}
