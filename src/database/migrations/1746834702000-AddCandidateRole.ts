import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCandidateRole1746834702000 implements MigrationInterface {
  name = 'AddCandidateRole1746834702000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add userId FK to candidates table
    await queryRunner.query(`
      ALTER TABLE "candidates"
      ADD COLUMN IF NOT EXISTS "userId" uuid
    `);

    await queryRunner.query(`
      ALTER TABLE "candidates"
      ADD CONSTRAINT "UQ_candidates_userId" UNIQUE ("userId")
    `);

    // Seed permission
    await queryRunner.query(`
      INSERT INTO "permissions" ("name", "createdAt", "updatedAt", "isDeleted")
      VALUES ('ACCESS_CANDIDATE_DASHBOARD', now(), now(), false)
      ON CONFLICT ("name") DO NOTHING
    `);

    // Seed candidate role
    await queryRunner.query(`
      INSERT INTO "roles" ("name", "createdAt", "updatedAt", "isDeleted")
      VALUES ('candidate', now(), now(), false)
      ON CONFLICT ("name") DO NOTHING
    `);

    // Attach ACCESS_CANDIDATE_DASHBOARD to candidate role
    await queryRunner.query(`
      INSERT INTO "role_permissions" ("rolesId", "permissionsId")
      SELECT r.id, p.id
      FROM "roles" r, "permissions" p
      WHERE r.name = 'candidate' AND p.name = 'ACCESS_CANDIDATE_DASHBOARD'
      ON CONFLICT DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "candidates" DROP CONSTRAINT IF EXISTS "UQ_candidates_userId"`);
    await queryRunner.query(`ALTER TABLE "candidates" DROP COLUMN IF EXISTS "userId"`);

    await queryRunner.query(`
      DELETE FROM "role_permissions"
      WHERE "rolesId" IN (SELECT id FROM "roles" WHERE name = 'candidate')
        AND "permissionsId" IN (SELECT id FROM "permissions" WHERE name = 'ACCESS_CANDIDATE_DASHBOARD')
    `);

    await queryRunner.query(`DELETE FROM "roles" WHERE name = 'candidate'`);
    await queryRunner.query(`DELETE FROM "permissions" WHERE name = 'ACCESS_CANDIDATE_DASHBOARD'`);
  }
}
