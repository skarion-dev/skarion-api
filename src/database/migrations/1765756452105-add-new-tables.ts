import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNewTables1765756452105 implements MigrationInterface {
  name = 'AddNewTables1765756452105';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "courses" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "isDeleted" boolean NOT NULL DEFAULT false, "deletedAt" TIMESTAMP, "title" character varying NOT NULL, "description" text, "price" integer NOT NULL, "currency" character varying NOT NULL DEFAULT 'usd', "imageUrl" character varying, CONSTRAINT "PK_3f70a487cc718ad8eda4e6d58c9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchases" DROP COLUMN "courseTitle"`,
    );
    await queryRunner.query(`ALTER TABLE "purchases" DROP COLUMN "courseId"`);
    await queryRunner.query(
      `ALTER TABLE "purchases" ADD "courseId" uuid NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchases" ADD CONSTRAINT "FK_9e00826bda60cd275c0e6a36ff8" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "purchases" DROP CONSTRAINT "FK_9e00826bda60cd275c0e6a36ff8"`,
    );
    await queryRunner.query(`ALTER TABLE "purchases" DROP COLUMN "courseId"`);
    await queryRunner.query(
      `ALTER TABLE "purchases" ADD "courseId" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchases" ADD "courseTitle" character varying(255) NOT NULL`,
    );
    await queryRunner.query(`DROP TABLE "courses"`);
  }
}
