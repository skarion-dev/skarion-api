import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('bookings')
@Index('IDX_bookings_slot_start_unique', ['slotStartAt'], { unique: true })
export class Booking extends BaseEntity {
  @Column({ name: 'full_name' })
  fullName: string;

  @Column()
  email: string;

  @Column()
  phone: string;

  @Column({ nullable: true })
  address?: string;

  @Column({ type: 'text', nullable: true })
  note?: string;

  @Column({ name: 'slot_date' })
  slotDate: string;

  @Column({ name: 'slot_value' })
  slotValue: string;

  @Column({ name: 'slot_label' })
  slotLabel: string;

  @Column({ type: 'timestamptz', name: 'slot_start_at' })
  slotStartAt: Date;

  @Column({ type: 'timestamptz', name: 'slot_end_at' })
  slotEndAt: Date;

  @Column({ default: 'scheduled' })
  status: string;

  @Column({ default: 'microsoft_teams', name: 'meeting_provider' })
  meetingProvider: string;

  @Column({ default: 'America/New_York' })
  timezone: string;

  @Column({ name: 'microsoft_event_id', nullable: true })
  microsoftEventId?: string;

  @Column({ name: 'meeting_join_url', nullable: true })
  meetingJoinUrl?: string;

  @Column({ name: 'resume_url', nullable: true })
  resumeUrl?: string;

  @Column({ name: 'reminder_scheduled', default: false })
  reminderScheduled: boolean;

  @Column({ type: 'timestamptz', name: 'reminder_sent_at', nullable: true })
  reminderSentAt?: Date | null;
}
