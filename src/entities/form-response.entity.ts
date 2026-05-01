import { Column, Entity } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('form_responses')
export class FormResponse extends BaseEntity {
  @Column({ name: 'referral_code', nullable: true })
  referralCode: string;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  address: string;

  @Column({ name: 'phone_number', nullable: true })
  phoneNumber: string;

  @Column({ name: 'note', nullable: true })
  note: string;

  @Column({ type: 'jsonb', nullable: true })
  rawPayload: Record<string, any>;
}
