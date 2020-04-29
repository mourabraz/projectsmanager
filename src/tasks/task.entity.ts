import {
  BaseEntity,
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

import { User } from 'src/users/user.entity';
import { Project } from 'src/projects/project.entity';
import { Fiile } from 'src/fiiles/fiile.entity';

@Entity('tasks')
export class Task extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column('timestamptz', { name: 'started_at' })
  startedAt: Date;

  @Column('timestamptz', { name: 'completed_at' })
  completedAt: Date;

  @Column({ name: 'user_id', nullable: true })
  userId: string;

  @Column({ name: 'project_id' })
  projectId: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @ManyToOne(
    type => User,
    user => user.tasks,
    { eager: false, onDelete: 'SET NULL' },
  )
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(
    type => Project,
    project => project.tasks,
    { eager: false, onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @OneToMany(
    type => Fiile,
    fiile => fiile.task,
    { eager: false },
  )
  fiiles: Fiile[];
}
