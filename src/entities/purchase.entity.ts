import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

@Entity('purchases')
export class Purchase extends BaseEntity {
  @Column()
  courseId: string;

  @Column({ type: 'varchar', length: 255 })
  courseTitle: string;

  @Column({ type: 'integer' })
  amount: number;

  @Column({ type: 'varchar', length: 10 })
  currency: string;

  @Column({ default: 'pending' })
  status: string;

  @Column({ nullable: true })
  stripeSessionId?: string;

  @Column({ nullable: true })
  stripePaymentIntentId?: string;

  @Column({ nullable: true })
  customerEmail?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user?: User;

  @Column({ nullable: true })
  userId?: string;
}
