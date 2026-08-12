import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBookingManagerRole1786532400000
  implements MigrationInterface
{
  name = 'AddBookingManagerRole1786532400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "permissions" ("name", "createdAt", "updatedAt", "isDeleted")
      VALUES ('MANAGE_BOOKING_SETTINGS', now(), now(), false)
      ON CONFLICT ("name") DO NOTHING
    `);
    await queryRunner.query(`
      INSERT INTO "roles" ("name", "createdAt", "updatedAt", "isDeleted")
      VALUES ('booking_manager', now(), now(), false)
      ON CONFLICT ("name") DO NOTHING
    `);
    await queryRunner.query(`
      INSERT INTO "role_permissions" ("rolesId", "permissionsId")
      SELECT r.id, p.id FROM "roles" r, "permissions" p
      WHERE r.name IN ('booking_manager', 'administrator')
        AND p.name = 'MANAGE_BOOKING_SETTINGS'
      ON CONFLICT DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "userroles"
      WHERE "rolesId" IN (SELECT id FROM "roles" WHERE name = 'booking_manager')
    `);
    await queryRunner.query(`
      DELETE FROM "role_permissions"
      WHERE "rolesId" IN (SELECT id FROM "roles" WHERE name = 'booking_manager')
    `);
    await queryRunner.query(`DELETE FROM "roles" WHERE name = 'booking_manager'`);
  }
}
