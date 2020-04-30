import {
  BaseEntity,
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Unique,
} from 'typeorm';
import * as bcrypt from 'bcryptjs';

import { Group } from 'src/groups/group.entity';
import { Fiile } from 'src/fiiles/fiile.entity';
import { UserGroup } from 'src/users-groups/user-group.entity';
import { Invitation } from 'src/invitations/invitation.entity';

@Entity('users')
@Unique(['email'])
export class User extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  name: string;

  @Column()
  email: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  photo: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(
    type => Group,
    group => group.owner,
    { eager: false },
  )
  ownerGroups: Group[];

  @OneToMany(
    type => Invitation,
    invitation => invitation.user,
    { eager: false },
  )
  invitations: Invitation[];

  @OneToMany(
    type => UserGroup,
    userGroup => userGroup.user,
    { eager: false },
  )
  groups: UserGroup[];

  @OneToMany(
    type => Fiile,
    fiile => fiile.user,
    { eager: false },
  )
  fiiles: Fiile[];

  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }
}
