import {
  BaseEntity,
  PrimaryGeneratedColumn,
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from 'src/users/user.entity';
import { Group } from 'src/groups/group.entity';

@Entity('invitations')
@Index(['emailTo', 'groupId'], { unique: true })
export class Invitation extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'email_to' })
  emailTo: string;

  @Column({ name: 'group_id' })
  groupId: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'accepted_at', type: 'timestamptz', nullable: true })
  acceptedAt: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @ManyToOne(
    type => User,
    user => user.invitations,
    { eager: false, onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(
    type => Group,
    group => group.invitations,
    { eager: false, onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'group_id' })
  group: Group;
}
