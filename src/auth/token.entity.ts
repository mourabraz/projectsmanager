import {
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Entity,
  Unique,
  OneToOne,
} from 'typeorm';

import { User } from '../users/user.entity';

@Entity('refresh_tokens')
@Unique(['email', 'userId'])
export class Token {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  token: string;

  @Column()
  email: string;

  @Column({ name: 'user_id' })
  userId: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToOne((type) => User, (type) => Token)
  user: User;
}
