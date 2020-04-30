import { Repository, EntityRepository } from 'typeorm';
import {
  Logger,
  InternalServerErrorException,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { Group } from './group.entity';
import { User } from 'src/users/user.entity';
import { CreateGroupDto } from './dto/create-group.dto';
import { TypeOrmErrorCode } from 'src/util/TypeOrmErrorCode.enum';
import { UserGroup } from 'src/users-groups/user-group.entity';

@EntityRepository(Group)
export class GroupRepository extends Repository<Group> {
  private logger = new Logger('GroupRepository');

  async getGroups(user: User): Promise<Group[]> {
    try {
      return await this.query(
        `SELECT groups.id, groups.name FROM groups
      INNER JOIN users_groups ON groups.id = users_groups.group_id 
      INNER JOIN users ON users_groups.user_id = users.id
      WHERE users.id = $1`,
        [user.id],
      );
    } catch (error) {
      this.logger.error(
        `Failed to get groups for user "${user.email}".`,
        error.stack,
      );
      throw new InternalServerErrorException();
    }
  }

  async getOwnerGroups(user: User): Promise<Group[]> {
    const query = this.createQueryBuilder('group');
    query.where('group.ownerId = :ownerId', { ownerId: user.id });

    try {
      return await query.getMany();
    } catch (error) {
      this.logger.error(
        `Failed to get own groups for user "${user.email}".`,
        error.stack,
      );
      throw new InternalServerErrorException();
    }
  }

  async getGroupById(id: string, user: User): Promise<Group> {
    let found = [];

    try {
      found = await this.query(
        `SELECT groups.id FROM groups
      INNER JOIN users_groups ON users_groups.group_id = groups.id 
      INNER JOIN users ON users_groups.user_id = users.id
      WHERE users.id = $1 AND groups.id = $2 LIMIT 1`,
        [user.id, id],
      );
    } catch (error) {
      this.logger.error(
        `Failed to get groups for user "${user.email}".`,
        error.stack,
      );
      throw new InternalServerErrorException();
    }

    if (!found[0]) {
      this.logger.error(
        `Failed to find group by id: "${id}" for user "${user.email}".`,
      );
      throw new BadRequestException();
    }

    return found[0];
  }

  async getOwnerGroupById(id: string, user: User): Promise<Group> {
    const found = await this.findOne({
      where: { id, userId: user.id },
    });

    if (!found) {
      this.logger.error(`Failed to find group by id: "${id}".`);
      throw new NotFoundException();
    }

    return found;
  }

  async createGroup(
    createGroupDto: CreateGroupDto,
    user: User,
  ): Promise<Group> {
    const { name } = createGroupDto;

    const group = new Group();
    group.owner = user;
    group.name = name;

    try {
      await group.save();

      const userGroup = new UserGroup();
      userGroup.userId = user.id;
      userGroup.groupId = group.id;

      await userGroup.save();

      delete group.owner;

      return group;
    } catch (error) {
      this.logger.error(
        `Failed to create group for user "${
          user.email
        }". Data: ${JSON.stringify(createGroupDto)}`,
        error.stack,
      );

      if (error.code === TypeOrmErrorCode.DUPLICATE_UNIQUE) {
        throw new ConflictException(`This name: "${name}" is not available`);
      }

      throw new InternalServerErrorException();
    }
  }

  async updateGroup(
    id: string,
    createGroupDto: CreateGroupDto,
    user: User,
  ): Promise<Group> {
    const group: Group = await this.getOwnerGroupById(id, user);
    group.name = createGroupDto.name;

    try {
      await group.save();

      return group;
    } catch (error) {
      this.logger.error(
        `Failed to update group with id: "${id}". Data: ${JSON.stringify(
          createGroupDto,
        )}`,
        error.stack,
      );

      throw new InternalServerErrorException();
    }
  }

  async deleteGroup(id: string, user: User): Promise<void> {
    const result = await this.delete({ id, ownerId: user.id });

    if (result.affected === 0) {
      this.logger.error(`Failed to delete group with id: "${id}".`);
      throw new NotFoundException();
    }
  }
}
