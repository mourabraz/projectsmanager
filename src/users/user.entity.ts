import {
  BaseEntity,
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToMany,
  Unique,
} from 'typeorm';
import * as bcrypt from 'bcryptjs';

import { Group } from 'src/groups/group.entity';
import { Project } from 'src/projects/project.entity';
import { Task } from 'src/tasks/task.entity';
import { Fiile } from 'src/fiiles/fiile.entity';

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

  @ManyToMany(
    type => Group,
    group => group.participants,
    { eager: false },
  )
  groups: Group[];

  @ManyToMany(
    type => Project,
    project => project.users,
  )
  projects: Project[];

  @OneToMany(
    type => Task,
    task => task.user,
    { eager: false },
  )
  tasks: Task[];

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
