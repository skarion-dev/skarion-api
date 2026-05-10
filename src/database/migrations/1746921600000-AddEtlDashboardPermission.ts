import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEtlDashboardPermission1746921600000 implements MigrationInterface {
  name = 'AddEtlDashboardPermission1746921600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Seed the new permission
    await queryRunner.query(`
      INSERT INTO "permissions" ("name", "createdAt", "updatedAt", "isDeleted")
      VALUES ('ACCESS_ETL_DASHBOARD', now(), now(), false)
      ON CONFLICT ("name") DO NOTHING
    `);

    // Attach it to the administrator role
    await queryRunner.query(`
      INSERT INTO "role_permissions" ("rolesId", "permissionsId")
      SELECT r.id, p.id
      FROM "roles" r, "permissions" p
      WHERE r.name = 'administrator' AND p.name = 'ACCESS_ETL_DASHBOARD'
      ON CONFLICT DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "role_permissions"
      WHERE "rolesId" IN (SELECT id FROM "roles" WHERE name = 'administrator')
        AND "permissionsId" IN (SELECT id FROM "permissions" WHERE name = 'ACCESS_ETL_DASHBOARD')
    `);
    await queryRunner.query(`DELETE FROM "permissions" WHERE name = 'ACCESS_ETL_DASHBOARD'`);
  }
}
