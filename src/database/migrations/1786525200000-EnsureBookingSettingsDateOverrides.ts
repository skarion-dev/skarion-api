import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Repairs production databases whose migration history was restored without
 * the booking_settings.dateOverrides column. IF NOT EXISTS keeps this safe for
 * databases where the original migration ran normally.
 */
export class EnsureBookingSettingsDateOverrides1786525200000
  implements MigrationInterface
{
  name = 'EnsureBookingSettingsDateOverrides1786525200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "booking_settings" ADD COLUMN IF NOT EXISTS "dateOverrides" jsonb DEFAULT NULL`,
    );
  }

  public async down(): Promise<void> {
    // Intentionally preserve the column: this is a schema-repair migration and
    // an older migration owns the column's normal rollback lifecycle.
  }
}
