import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { Course } from './course.entity';

@Entity('purchases')
export class Purchase extends BaseEntity {
  @Column()
  courseId: string;

  @ManyToOne(() => Course, (course) => course.purchases)
  @JoinColumn({ name: 'courseId' })
  course: Course;

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

  @Column({ nullable: true })
  userId?: string;

  @ManyToOne(() => User, (user) => user.purchases)
  @JoinColumn({ name: 'userId' })
  user?: User;
}
