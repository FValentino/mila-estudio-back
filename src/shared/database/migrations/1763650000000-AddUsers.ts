import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUsers1763650000000 implements MigrationInterface {
  readonly name = 'AddUsers1763650000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "email" character varying(255) NOT NULL,
        "passwordHash" character varying(255) NOT NULL,
        "role" character varying(10) NOT NULL DEFAULT 'user',
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`CREATE UNIQUE INDEX "UQ_users_email_lower" ON "users" (lower("email"))`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_users_email_lower"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
  }
}
