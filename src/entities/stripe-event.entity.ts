import { Entity, Column } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('stripe_events')
export class StripeEvent extends BaseEntity {
  @Column({ type: 'varchar', length: 255, nullable: false })
  type: string;

  @Column({ type: 'json' })
  payload: any;
}
