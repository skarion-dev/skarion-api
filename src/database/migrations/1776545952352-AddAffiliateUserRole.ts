import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAffiliateUserRole1776545952352 implements MigrationInterface {
    name = 'AddAffiliateUserRole1776545952352'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "referralCode" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "UQ_b7f8278f4e89249bb75c9a15899" UNIQUE ("referralCode")`);

        // Seed permissions
        await queryRunner.query(`
            INSERT INTO "permissions" ("name", "createdAt", "updatedAt", "isDeleted")
            VALUES ('MANAGE_USERS', now(), now(), false),
                   ('ACCESS_AFFILIATE_DASHBOARD', now(), now(), false)
            ON CONFLICT ("name") DO NOTHING
        `);

        // Seed roles
        await queryRunner.query(`
            INSERT INTO "roles" ("name", "createdAt", "updatedAt", "isDeleted")
            VALUES ('administrator', now(), now(), false),
                   ('affiliate_user', now(), now(), false)
            ON CONFLICT ("name") DO NOTHING
        `);

        // Attach MANAGE_USERS to administrator
        await queryRunner.query(`
            INSERT INTO "role_permissions" ("rolesId", "permissionsId")
            SELECT r.id, p.id FROM "roles" r, "permissions" p
            WHERE r.name = 'administrator' AND p.name = 'MANAGE_USERS'
            ON CONFLICT DO NOTHING
        `);

        // Attach ACCESS_AFFILIATE_DASHBOARD to affiliate_user
        await queryRunner.query(`
            INSERT INTO "role_permissions" ("rolesId", "permissionsId")
            SELECT r.id, p.id FROM "roles" r, "permissions" p
            WHERE r.name = 'affiliate_user' AND p.name = 'ACCESS_AFFILIATE_DASHBOARD'
            ON CONFLICT DO NOTHING
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "UQ_b7f8278f4e89249bb75c9a15899"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "referralCode"`);
    }

}
