import { Repository, EntityRepository, DeleteResult } from 'typeorm';
import { Logger, InternalServerErrorException } from '@nestjs/common';

import { Group } from './group.entity';
import { User } from '../users/user.entity';
import { CreateGroupDto } from './dto/create-group.dto';
import { UserGroup } from '../users-groups/user-group.entity';

@EntityRepository(Group)
export class GroupRepository extends Repository<Group> {
  private logger = new Logger('GroupRepository');

  async getGroupsForUser(user: User): Promise<Group[]> {
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

  // async getOwnerGroups(user: User): Promise<Group[]> {
  //   const query = this.createQueryBuilder('group');
  //   query.where('group.ownerId = :ownerId', { ownerId: user.id });

  //   try {
  //     return await query.getMany();
  //   } catch (error) {
  //     this.logger.error(
  //       `Failed to get own groups for user "${user.email}".`,
  //       error.stack,
  //     );
  //     throw new InternalServerErrorException();
  //   }
  // }

  async getGroupByIdForUser(id: string, user: User): Promise<Group> {
    try {
      const groups = await this.query(
        `SELECT groups.id FROM groups
      INNER JOIN users_groups ON users_groups.group_id = groups.id
      INNER JOIN users ON users_groups.user_id = users.id
      WHERE users.id = $1 AND groups.id = $2 LIMIT 1`,
        [user.id, id],
      );

      return groups[0];
    } catch (error) {
      this.logger.error(
        `Failed to get groups for user "${user.email}".`,
        error.stack,
      );
      throw new InternalServerErrorException();
    }
  }

  async getGroupByIdForOwner(id: string, user: User): Promise<Group> {
    const found = await this.findOne({
      where: { id, ownerId: user.id },
    });

    if (!found) {
      this.logger.error(
        `Failed to find group by id: "${id}" for owner "${user.email}".`,
      );
      throw new InternalServerErrorException();
    }

    return found;
  }

  async createGroup(createGroupDto: CreateGroupDto): Promise<Group> {
    const { name, ownerId: userId } = createGroupDto;

    try {
      const group = new Group();
      group.ownerId = userId;
      group.name = name;

      await group.save();

      const userGroup = new UserGroup();
      userGroup.userId = group.ownerId;
      userGroup.groupId = group.id;

      await userGroup.save();

      delete group.owner;

      return group;
    } catch (error) {
      this.logger.error(
        `Failed to create group for user id "${userId}". Data: ${JSON.stringify(
          createGroupDto,
        )}`,
        error.stack,
      );

      throw new InternalServerErrorException();
    }
  }

  async updateGroup(
    id: string,
    createGroupDto: CreateGroupDto,
  ): Promise<Group> {
    try {
      await this.update(id, { name: createGroupDto.name });

      return await this.findOne(id);
    } catch (error) {
      this.logger.error(
        `Failed to update group with id: "${id}" for owner id "${
          createGroupDto.ownerId
        }". Data: ${JSON.stringify(createGroupDto)}`,
        error.stack,
      );

      throw new InternalServerErrorException();
    }
  }

  async deleteGroup(id: string): Promise<DeleteResult> {
    const result = await this.delete({ id });

    if (result.affected === 0) {
      this.logger.error(`Failed to delete group with id: "${id}".`);
      throw new InternalServerErrorException();
    }

    return result;
  }
}
