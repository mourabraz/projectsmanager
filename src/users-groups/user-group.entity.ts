import {
  BaseEntity,
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  Index,
  JoinColumn,
} from 'typeorm';

import { Group } from 'src/groups/group.entity';
import { User } from 'src/users/user.entity';

@Entity('users_groups')
@Index(['userId', 'groupId'], { unique: true })
export class UserGroup extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'group_id' })
  groupId: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @ManyToOne(
    type => User,
    user => user.groups,
    { eager: false, onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(
    type => Group,
    group => group.usersGroups,
    { eager: false, onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'group_id' })
  group: Group;
}
