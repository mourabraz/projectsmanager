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

import { Task } from '../tasks/task.entity';
import { Fiile } from '../fiiles/fiile.entity';

@Entity('steps')
export class Step {
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

  @Column({ name: 'task_id' })
  taskId: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @ManyToOne((type) => Task, (task) => task.steps, {
    eager: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'task_id' })
  task: Task;

  @OneToMany((type) => Fiile, (fiile) => fiile.step, { eager: false })
  fiiles: Fiile[];
}
