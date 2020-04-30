import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UsersGroupsService } from './users-groups.service';
import { UserGroupRepository } from './user-group.repository';

@Module({
  imports: [TypeOrmModule.forFeature([UserGroupRepository])],
  providers: [UsersGroupsService],
  exports: [UsersGroupsService],
})
export class UsersGroupsModule {}
