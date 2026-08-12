import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDateOverridesToBookingSettings1783900000000
  implements MigrationInterface
{
  name = 'AddDateOverridesToBookingSettings1783900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "booking_settings" ADD COLUMN IF NOT EXISTS "dateOverrides" jsonb DEFAULT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "booking_settings" DROP COLUMN IF EXISTS "dateOverrides"`,
    );
  }
}
