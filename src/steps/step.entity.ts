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

  @Column({ nullable: true, default: '' })
  description: string;

  @Column()
  order: number;

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

  @Column({ name: 'task_id' })
  taskId: string;

  @Column({ name: 'user_id', nullable: true })
  ownerId: string;

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
