import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBookingsTable1781588000000 implements MigrationInterface {
  name = 'AddBookingsTable1781588000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "bookings" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "isDeleted" boolean NOT NULL DEFAULT false,
        "deletedAt" TIMESTAMP,
        "full_name" character varying NOT NULL,
        "email" character varying NOT NULL,
        "phone" character varying NOT NULL,
        "address" character varying,
        "note" text,
        "slot_date" character varying NOT NULL,
        "slot_value" character varying NOT NULL,
        "slot_label" character varying NOT NULL,
        "slot_start_at" TIMESTAMPTZ NOT NULL,
        "slot_end_at" TIMESTAMPTZ NOT NULL,
        "status" character varying NOT NULL DEFAULT 'scheduled',
        "meeting_provider" character varying NOT NULL DEFAULT 'microsoft_teams',
        "timezone" character varying NOT NULL DEFAULT 'America/New_York',
        "microsoft_event_id" character varying,
        "meeting_join_url" character varying,
        "reminder_scheduled" boolean NOT NULL DEFAULT false,
        "reminder_sent_at" TIMESTAMPTZ,
        CONSTRAINT "PK_bookings_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_bookings_slot_start_unique"
      ON "bookings" ("slot_start_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_bookings_slot_start_unique"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "bookings"`);
  }
}
