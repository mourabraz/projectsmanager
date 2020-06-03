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

import { Project } from '../projects/project.entity';
import { Fiile } from '../fiiles/fiile.entity';
import { UserProject } from '../users-projects/user-project.entity';
import { Invitation } from '../invitations/invitation.entity';
import { Task } from '../tasks/task.entity';
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

  @Column({ select: false })
  password: string;

  @Column({
    type: 'timestamptz',
    precision: 3,
    name: 'password_updated_at',
    default: () => 'NOW()',
    select: false,
  })
  passwordUpdatedAt: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz', precision: 3 })
  updatedAt: Date;

  @OneToOne((type) => Photo, (photo) => photo.user)
  photo: Photo;

  @OneToMany((type) => Project, (project) => project.owner, { eager: false })
  ownerProjects: Project[];

  @OneToMany((type) => Invitation, (invitation) => invitation.user, {
    eager: false,
  })
  invitations: Invitation[];

  @OneToMany((type) => Task, (task) => task.owner, { eager: false })
  tasks: Task[];

  @OneToMany((type) => UserProject, (userProject) => userProject.user, {
    eager: false,
  })
  usersProjects: UserProject[];

  @OneToMany((type) => Fiile, (fiile) => fiile.user, { eager: false })
  fiiles: Fiile[];

  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }
}
