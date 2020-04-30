import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { UserRepository } from './user.repository';
import { User } from './user.entity';
import { Group } from 'src/groups/group.entity';
import { GroupsService } from 'src/groups/groups.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserRepository)
    private userRepository: UserRepository,
    private groupsService: GroupsService,
  ) {}

  async isUserInGroup(user: User, group: Group): Promise<boolean> {
    const groups = await this.groupsService.getGroups(user);

    return groups.findIndex(i => i.id === group.id) !== -1;
  }
}
