import {
  BaseEntity,
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';

import { User } from '../users/user.entity';
import { Project } from '../projects/project.entity';
import { UserGroup } from '../users-groups/user-group.entity';
import { Invitation } from '../invitations/invitation.entity';

@Entity('groups')
@Index(['name', 'ownerId'], { unique: true })
export class Group extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ name: 'user_id' })
  ownerId: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @ManyToOne(
    type => User,
    user => user.ownerGroups,
    { eager: false, onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'user_id' })
  owner: User;

  @OneToMany(
    type => UserGroup,
    userGroup => userGroup.user,
    { eager: false },
  )
  usersGroups: UserGroup[];
  //participants: UserGroup[];

  @OneToMany(
    type => Project,
    project => project.group,
    { eager: false },
  )
  projects: Project[];

  @OneToMany(
    type => Invitation,
    invitation => invitation.group,
    { eager: false },
  )
  invitations: Invitation[];
}
