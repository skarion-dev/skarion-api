import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCustomerSupportRole1747008000000 implements MigrationInterface {
  name = 'AddCustomerSupportRole1747008000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Seed CUSTOMER_SUPPORT role
    await queryRunner.query(`
      INSERT INTO "roles" ("name", "createdAt", "updatedAt", "isDeleted")
      VALUES ('customer_support', now(), now(), false)
      ON CONFLICT ("name") DO NOTHING
    `);

    // Seed ACCESS_CUSTOMER_SUPPORT_DASHBOARD permission
    await queryRunner.query(`
      INSERT INTO "permissions" ("name", "createdAt", "updatedAt", "isDeleted")
      VALUES ('ACCESS_CUSTOMER_SUPPORT_DASHBOARD', now(), now(), false)
      ON CONFLICT ("name") DO NOTHING
    `);

    // Link permission → role
    await queryRunner.query(`
      INSERT INTO "role_permissions" ("rolesId", "permissionsId")
      SELECT r.id, p.id
      FROM "roles" r, "permissions" p
      WHERE r.name = 'customer_support'
        AND p.name = 'ACCESS_CUSTOMER_SUPPORT_DASHBOARD'
      ON CONFLICT DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "role_permissions"
      WHERE "rolesId" IN (SELECT id FROM "roles" WHERE name = 'customer_support')
        AND "permissionsId" IN (SELECT id FROM "permissions" WHERE name = 'ACCESS_CUSTOMER_SUPPORT_DASHBOARD')
    `);
    await queryRunner.query(`DELETE FROM "permissions" WHERE name = 'ACCESS_CUSTOMER_SUPPORT_DASHBOARD'`);
    await queryRunner.query(`DELETE FROM "roles" WHERE name = 'customer_support'`);
  }
}
