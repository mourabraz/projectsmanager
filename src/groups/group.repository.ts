import { Repository, EntityRepository } from 'typeorm';
import {
  Logger,
  InternalServerErrorException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

import { Group } from './group.entity';
import { User } from 'src/users/user.entity';
import { CreateGroupDto } from './dto/create-group.dto';
import { TypeOrmErrorCode } from 'src/util/TypeOrmErrorCode.enum';

@EntityRepository(Group)
export class GroupRepository extends Repository<Group> {
  private logger = new Logger('GroupRepository');

  async getGroups(user: User): Promise<Group[]> {
    const query = this.createQueryBuilder('groups')
      .relation(User, 'groups')
      .of(user);

    try {
      return await query.loadMany();
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
    group.participants = [user];

    try {
      await group.save();

      delete group.participants;
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
    const group: Group = await this.getGroupById(id, user);
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
