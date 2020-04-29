import {
  BaseEntity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Entity,
} from 'typeorm';
import { User } from 'src/users/user.entity';
import { Project } from 'src/projects/project.entity';
import { Task } from 'src/tasks/task.entity';

@Entity('fiiles')
export class Fiile extends BaseEntity {
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

  @Column({ name: 'project_id', nullable: true, default: null })
  projectId: string;

  @Column({ name: 'task_id', nullable: true, default: null })
  taskId: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @ManyToOne(
    type => User,
    user => user.fiiles,
    { eager: false, onDelete: 'SET NULL' },
  )
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(
    type => Project,
    project => project.fiiles,
    { eager: false, onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @ManyToOne(
    type => Task,
    task => task.fiiles,
    { eager: false, onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'task_id' })
  task: Task;
}
