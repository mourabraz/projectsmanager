import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { UserRepository } from './user.repository';
import { User } from './user.entity';
import { Group } from '../groups/group.entity';
import { GroupsService } from '../groups/groups.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserRepository)
    private userRepository: UserRepository,
    private groupsService: GroupsService,
  ) {}

  async isUserInGroup(user: User, group: Group): Promise<boolean> {
    const groups = await this.groupsService.getGroupsForUser(user);

    return groups.findIndex(i => i.id === group.id) !== -1;
  }

  async getUserByEmail(email: string): Promise<User> {
    return await this.userRepository.findOne({ where: { email } });
  }
}
