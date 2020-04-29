import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { GroupRepository } from './group.repository';
import { User } from 'src/users/user.entity';
import { Group } from './group.entity';
import { CreateGroupDto } from './dto/create-group.dto';

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(GroupRepository)
    private groupRepository: GroupRepository,
  ) {}

  async getGroups(user: User) {
    return this.groupRepository.getGroups(user);
  }

  async createGroup(
    createGroupDto: CreateGroupDto,
    user: User,
  ): Promise<Group> {
    return this.groupRepository.createGroup(createGroupDto, user);
  }

  async deleteGroup(id: string, user: User): Promise<void> {
    return this.groupRepository.deleteGroup(id, user);
  }
}
