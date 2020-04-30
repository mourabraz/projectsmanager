import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserRepository } from './user.repository';
import { UsersService } from './users.service';
import { GroupsModule } from 'src/groups/groups.module';

@Module({
  imports: [TypeOrmModule.forFeature([UserRepository]), GroupsModule],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
