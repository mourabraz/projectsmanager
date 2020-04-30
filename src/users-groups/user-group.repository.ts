import { Repository, EntityRepository } from 'typeorm';
import { Logger, InternalServerErrorException } from '@nestjs/common';

import { UserGroup } from './user-group.entity';
import { User } from 'src/users/user.entity';

@EntityRepository(UserGroup)
export class UserGroupRepository extends Repository<UserGroup> {
  private logger = new Logger('UserGroupRepository');

  async createUserGroup(user: User, groupId: string): Promise<UserGroup> {
    const userGroup = new UserGroup();
    userGroup.userId = user.id;
    userGroup.groupId = groupId;

    try {
      await userGroup.save();
      // delete userGroup.user;

      return userGroup;
    } catch (error) {
      this.logger.error(
        `Failed to add participante "${user.email}" in group id: "${groupId}".`,
        error.stack,
      );
      throw new InternalServerErrorException();
    }
  }
}
