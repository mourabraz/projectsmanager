import {
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
  Column,
  Entity,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';

import { Project } from '../projects/project.entity';
import { Step } from '../steps/step.entity';
import { Fiile } from '../fiiles/fiile.entity';
import { User } from '../users/user.entity';

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ nullable: true, default: '' })
  description: string;

  @Column({
    type: 'timestamptz',
    precision: 3,
    name: 'started_at',
    default: () => 'NOW()',
  })
  startedAt: Date;

  @Column({
    type: 'timestamptz',
    precision: 3,
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

  @Column({ name: 'project_id' })
  projectId: string;

  @Column({ name: 'user_id', nullable: true })
  ownerId: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @ManyToOne((type) => Project, (project) => project.tasks, {
    eager: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @ManyToOne((type) => User, (user) => user.tasks, {
    eager: false,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'user_id' })
  owner: User;

  @OneToMany((type) => Step, (step) => step.task, { eager: false })
  steps: Step[];

  @OneToMany((type) => Fiile, (fiile) => fiile.task, { eager: false })
  fiiles: Fiile[];
}
