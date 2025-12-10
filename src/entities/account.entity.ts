import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

@Entity('accounts')
export class Account extends BaseEntity {
  @Column()
  type: string;

  @Column()
  provider: string;
  @Column()
  providerAccountId: string;

  @Column({ nullable: true })
  accessToken?: string;

  @Column({ nullable: true })
  refreshToken?: string;

  @Column({ type: 'bigint', nullable: true })
  expiresAt?: number;

  @Column({ nullable: true })
  scope?: string;

  @ManyToOne(() => User, (user) => user.accounts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;
}
