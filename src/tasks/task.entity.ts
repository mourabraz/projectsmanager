import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

import { Project } from '../projects/project.entity';
import { Fiile } from '../fiiles/fiile.entity';

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column({ type: 'timestamptz', precision: 3, name: 'started_at' })
  startedAt: Date;

  @Column({ type: 'timestamptz', precision: 3, name: 'completed_at' })
  completedAt: Date;

  @Column({ name: 'project_id' })
  projectId: string;

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

  @OneToMany((type) => Fiile, (fiile) => fiile.task, { eager: false })
  fiiles: Fiile[];
}
