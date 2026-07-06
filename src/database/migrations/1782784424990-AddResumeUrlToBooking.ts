import { MigrationInterface, QueryRunner } from "typeorm";

export class AddResumeUrlToBooking1782784424990 implements MigrationInterface {
    name = 'AddResumeUrlToBooking1782784424990'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "bookings" ADD "resume_url" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "bookings" DROP COLUMN "resume_url"`);
    }

}
