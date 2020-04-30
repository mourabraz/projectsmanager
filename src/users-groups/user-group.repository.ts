import { Repository, EntityRepository } from 'typeorm';

import { UserGroup } from './user-group.entity';

@EntityRepository(UserGroup)
export class UserGroupRepository extends Repository<UserGroup> {}
