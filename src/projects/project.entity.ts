import {
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
import { Task } from '../tasks/task.entity';
import { UserProject } from '../users-projects/user-project.entity';
import { Invitation } from '../invitations/invitation.entity';

@Entity('projects')
@Index(['name', 'ownerId'], { unique: true })
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ name: 'user_id' })
  ownerId: string;

  @Column({
    type: 'timestamptz',
    precision: 3,
    name: 'archived_at',
    nullable: true,
    default: null,
  })
  archivedAt: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @ManyToOne((type) => User, (user) => user.ownerProjects, {
    eager: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  owner: User;

  @OneToMany((type) => UserProject, (userProject) => userProject.project)
  usersProjects: UserProject[];
  //participants: UserProject[];

  @OneToMany((type) => Task, (task) => task.project, { eager: false })
  tasks: Task[];

  @OneToMany((type) => Invitation, (invitation) => invitation.project, {
    eager: false,
  })
  invitations: Invitation[];
}
