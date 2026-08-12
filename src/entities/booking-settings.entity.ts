import {
  Column,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Singleton row that stores admin-controlled booking configuration.
 * Only one row ever exists (id = 1). Falls back to env var defaults
 * when the row has not been created yet.
 */
@Entity('booking_settings')
export class BookingSettings {
  @PrimaryColumn({ type: 'int', default: 1 })
  id: number;

  /**
   * Subset of the canonical slot values that are currently enabled.
   * e.g. ["10:00", "11:00", "14:00"]
   */
  @Column('simple-array', {
    nullable: false,
    default: '10:00,11:00,12:00,13:00,14:00,21:00,22:00,23:00',
  })
  enabledSlots: string[];

  /**
   * ISO weekday numbers (1=Mon … 7=Sun) that are open for booking.
   * Default: Sun–Thu (BD work week) excluding Fri(5) and Sat(6)
   */
  @Column('simple-array', {
    nullable: false,
    default: '1,2,3,4,7',
  })
  enabledWeekdays: number[];

  /** Duration of each slot in minutes. */
  @Column({ type: 'int', default: 30 })
  durationMinutes: number;

  /** How many days ahead to generate slots for. */
  @Column({ type: 'int', default: 30 })
  availabilityDays: number;

  /** Minimum hours before a slot that it can be booked. */
  @Column({ type: 'int', default: 2 })
  minimumLeadHours: number;

  /**
   * Hard block: no slots are offered at or before this UTC timestamp.
   * null = no block in effect.
   */
  @Column({ type: 'timestamptz', nullable: true, default: null })
  bookingUnavailableUntil: Date | null;

  /**
   * Per-date slot overrides. Keys are specific dates in "YYYY-MM-DD" format.
   * When a key is present its value replaces the global enabledSlots for that date.
   * When null or empty, all dates use the global enabledSlots.
   * e.g. { "2026-08-20": ["14:00", "21:00"], "2026-08-25": ["10:00"] }
   */
  @Column({ type: 'jsonb', nullable: true, default: null })
  dateOverrides: Record<string, string[]> | null;

  @UpdateDateColumn()
  updatedAt: Date;
}
