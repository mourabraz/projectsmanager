import {
  BaseEntity,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
  Column,
  Entity,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';

import { Group } from 'src/groups/group.entity';
import { Task } from 'src/tasks/task.entity';
import { Fiile } from 'src/fiiles/fiile.entity';
import { User } from 'src/users/user.entity';

@Entity('projects')
export class Project extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ nullable: true, default: '' })
  description: string;

  @Column('timestamptz', {
    name: 'started_at',
    default: () => 'NOW()',
  })
  startedAt: Date;

  @Column('timestamptz', {
    name: 'completed_at',
    nullable: true,
    default: null,
  })
  completedAt: Date;

  @Column('enum', {
    enum: ['OPEN', 'IN_PROGRESS', 'CLOSE', 'ABANDONED'],
    default: 'OPEN',
  })
  status: 'OPEN' | 'IN_PROGRESS' | 'CLOSE' | 'ABANDONED';

  @Column({ name: 'group_id' })
  groupId: string;

  @Column({ name: 'user_id', nullable: true })
  ownerId: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @ManyToOne(
    type => Group,
    group => group.projects,
    { eager: false, onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'group_id' })
  group: Group;

  @ManyToOne(
    type => User,
    user => user.projects,
    { eager: false, onDelete: 'SET NULL' },
  )
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(
    type => Task,
    task => task.project,
    { eager: false },
  )
  tasks: Task[];

  @OneToMany(
    type => Fiile,
    fiile => fiile.project,
    { eager: false },
  )
  fiiles: Fiile[];
}
