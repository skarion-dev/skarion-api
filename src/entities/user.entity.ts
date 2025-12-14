import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Account } from './account.entity';

@Entity('users')
export class User extends BaseEntity {
  @Column({ unique: true, nullable: true })
  username: string;

  @Column({ nullable: true })
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  password?: string;

  @Column({ nullable: true })
  image?: string;

  @Column({ nullable: true, length: 500 })
  bio?: string;

  @Column({ type: 'timestamp', nullable: true })
  emailVerifiedAt?: Date;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: 'user' })
  role: string;

  @OneToMany(() => Account, (account) => account.user, { cascade: true })
  accounts: Account[];

  @Column({ nullable: true })
  lastLogin?: Date;
}
