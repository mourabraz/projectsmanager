import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { GroupRepository } from './group.repository';
import { User } from '../users/user.entity';
import { Group } from './group.entity';
import { CreateGroupDto } from './dto/create-group.dto';
import { UsersGroupsService } from '../users-groups/users-groups.service';

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(GroupRepository)
    private groupRepository: GroupRepository,
    private usersGroupsService: UsersGroupsService,
  ) {}

  async getGroupsForUser(user: User) {
    return await this.groupRepository.getGroupsForUser(user);
  }

  async getGroupByIdForUser(id: string, user: User): Promise<Group> {
    return await this.groupRepository.getGroupByIdForUser(id, user);
  }

  async getGroupByIdForOwner(id: string, user: User): Promise<Group> {
    return await this.groupRepository.getGroupByIdForOwner(id, user);
  }

  async createGroup(
    createGroupDto: CreateGroupDto,
    user: User,
  ): Promise<Group> {
    const groupExists = await this.groupRepository.findOne({
      where: { name: createGroupDto.name, ownerId: user.id },
    });

    if (groupExists) {
      throw new BadRequestException(
        `This name "${createGroupDto.name}" is not available`,
      );
    }

    createGroupDto.ownerId = user.id;

    const group = await this.groupRepository.createGroup(createGroupDto);

    if (group) {
      await this.usersGroupsService.addParticipantToGroup(user, group.id);
    }

    return group;
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

  async deleteGroup(id: string, user: User): Promise<{ total: number }> {
    const found = await this.groupRepository.findOne({
      where: { id, ownerId: user.id },
    });

    if (!found) {
      throw new NotFoundException();
    }

    return {
      total: (await this.groupRepository.deleteGroup(id)).affected,
    };
  }
}
