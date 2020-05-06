import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
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

  async getGroupsForUser(user: User) {
    return this.groupRepository.getGroupsForUser(user);
  }

  // async getGroupByIdForUser(id: string, user: User): Promise<Group> {
  //   return await this.groupRepository.getGroupByIdForUser(id, user);
  // }

  async createGroup(
    createGroupDto: CreateGroupDto,
    user: User,
  ): Promise<Group> {
    const group = await this.groupRepository.findOne({
      where: { name: createGroupDto.name, ownerId: user.id },
    });

    if (group) {
      throw new BadRequestException(
        `This name "${createGroupDto.name}" is not available`,
      );
    }

    createGroupDto.ownerId = user.id;

    return await this.groupRepository.createGroup(createGroupDto);
  }

  async updateGroup(
    id: string,
    createGroupDto: CreateGroupDto,
    user: User,
  ): Promise<Group> {
    const found = await this.groupRepository.findOne({
      where: {
        id,
        ownerId: user.id,
      },
    });

    if (!found) {
      throw new NotFoundException();
    }

    createGroupDto.ownerId = user.id;

    return await this.groupRepository.updateGroup(id, createGroupDto);
  }

  async deleteGroup(id: string, user: User): Promise<number> {
    const found = await this.groupRepository.findOne({
      where: { id, ownerId: user.id },
    });

    if (!found) {
      throw new NotFoundException();
    }

    return await this.groupRepository.deleteGroup(id);
  }
}
