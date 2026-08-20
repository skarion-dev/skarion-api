import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTimezoneToBookingSettings1787000000000 implements MigrationInterface {
  name = 'AddTimezoneToBookingSettings1787000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "booking_settings" ADD "timezone" character varying NOT NULL DEFAULT 'America/New_York'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "booking_settings" DROP COLUMN "timezone"`,
    );
  }
}
