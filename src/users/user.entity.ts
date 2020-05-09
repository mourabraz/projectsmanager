import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Unique,
  OneToOne,
} from 'typeorm';
import * as bcrypt from 'bcryptjs';

import { Group } from '../groups/group.entity';
import { Fiile } from '../fiiles/fiile.entity';
import { UserGroup } from '../users-groups/user-group.entity';
import { Invitation } from '../invitations/invitation.entity';
import { Project } from '../projects/project.entity';
import { Photo } from './photo.entity';

@Entity('users')
@Unique(['email'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  name: string;

  @Column()
  email: string;

  @Column({ select: true })
  password: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz', precision: 3 })
  updatedAt: Date;

  @OneToOne(
    type => Photo,
    photo => photo.user,
  )
  photo: Photo;

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
    type => Project,
    project => project.owner,
    { eager: false },
  )
  projects: Project[];

  @OneToMany(
    type => UserGroup,
    userGroup => userGroup.user,
    { eager: false },
  )
  usersGroups: UserGroup[];

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
