import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

export enum PaymentStatus {
  INITIAL = 'INITIAL',
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  DUE = 'DUE',
  CANCELLED = 'CANCELLED',
}

export enum PaymentType {
  ONE_TIME = 'ONE_TIME',
}

@Entity('payments')
export class Payment extends BaseEntity {
  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  user_id: string;

  @Column({ type: 'integer' })
  amount: number;

  @Column({ type: 'timestamp', nullable: true })
  initiated_at?: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  pending_at?: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  success_at?: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  cancelled_at?: Date | null;

  @Column({ type: 'varchar', nullable: true })
  payment_activity_reference?: string | null;

  @Column({ type: 'varchar', nullable: true })
  transaction_provider_reference?: string | null;

  //   @Column({
  //     type: 'enum',
  //     enum: PaymentProvider,
  //     nullable: true,
  //   })
  //   provider_name?: PaymentProvider | null;

  @Column({ type: 'varchar', nullable: true })
  provider_payment_id?: string | null;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
  })
  status: PaymentStatus;

  @Column({ type: 'integer', default: 0 })
  attempt_count: number;

  @Column({ type: 'timestamp', nullable: true })
  last_attempt_at?: Date | null;

  @Column({ type: 'varchar', nullable: true })
  last_failure_reason?: string;

  @Column({
    type: 'enum',
    enum: PaymentType,
    default: PaymentType.ONE_TIME,
  })
  type: PaymentType;

  @Column({ type: 'timestamp', nullable: true })
  refunded_at?: Date | null;
}
