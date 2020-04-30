import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { UserGroup } from './user-group.entity';
import { UserGroupRepository } from './user-group.repository';
import { User } from 'src/users/user.entity';

@Injectable()
export class UsersGroupsService {
  constructor(
    @InjectRepository(UserGroupRepository)
    private userGroupRepository: UserGroupRepository,
  ) {}

  async addParticipantToGroup(user: User, id: string): Promise<UserGroup> {
    return this.userGroupRepository.createUserGroup(user, id);
  }
}
