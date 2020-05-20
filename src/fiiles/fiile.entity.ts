import {
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Entity,
} from 'typeorm';

import { User } from '../users/user.entity';
import { Task } from '../tasks/task.entity';
import { Step } from '../steps/step.entity';

@Entity('fiiles')
export class Fiile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true, default: '' })
  name: string;

  @Column('enum', { enum: ['IMAGE', 'VIDEO', 'PDF'], default: 'IMAGE' })
  type: 'IMAGE' | 'VIDEO' | 'PDF';

  @Column({ nullable: false })
  path: string;

  @Column({ nullable: true, default: null })
  size: number;

  @Column({ name: 'user_id', nullable: true, default: null })
  userId: string;

  @Column({ name: 'task_id', nullable: true, default: null })
  taskId: string;

  @Column({ name: 'step_id', nullable: true, default: null })
  stepId: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @ManyToOne((type) => User, (user) => user.fiiles, {
    eager: false,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne((type) => Task, (task) => task.fiiles, {
    eager: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'task_id' })
  task: Task;

  @ManyToOne((type) => Step, (step) => step.fiiles, {
    eager: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'step_id' })
  step: Step;
}
