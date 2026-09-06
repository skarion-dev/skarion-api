import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMeetingSummaryToBooking1787100000000 implements MigrationInterface {
  name = 'AddMeetingSummaryToBooking1787100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "meeting_summary" text`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "bookings" DROP COLUMN IF EXISTS "meeting_summary"`,
    );
  }
}
