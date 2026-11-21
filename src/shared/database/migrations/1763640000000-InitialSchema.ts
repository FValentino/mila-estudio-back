import type { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1763640000000 implements MigrationInterface {
  readonly name = 'InitialSchema1763640000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "appointments_status_enum" AS ENUM ('confirmed', 'cancelled')`);

    await queryRunner.query(`
      CREATE TABLE "areas" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" character varying(120) NOT NULL,
        "description" text,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_areas_name" UNIQUE ("name"),
        CONSTRAINT "PK_areas" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "professionals" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "firstName" character varying(120) NOT NULL,
        "lastName" character varying(120) NOT NULL,
        "area_id" uuid NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_professionals" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "services" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" character varying(150) NOT NULL,
        "durationMinutes" integer NOT NULL,
        "price" numeric(10,2) NOT NULL,
        "area_id" uuid NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_services" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "appointments" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "professional_id" uuid NOT NULL,
        "service_id" uuid NOT NULL,
        "start" TIMESTAMP WITH TIME ZONE NOT NULL,
        "endAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        "clientName" character varying(150) NOT NULL,
        "clientPhone" character varying(50) NOT NULL,
        "clientEmail" character varying(150),
        "notes" text,
        "status" "appointments_status_enum" NOT NULL DEFAULT 'confirmed',
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_appointments" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "professionals"
      ADD CONSTRAINT "FK_professionals_area_id" FOREIGN KEY ("area_id")
      REFERENCES "areas"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "services"
      ADD CONSTRAINT "FK_services_area_id" FOREIGN KEY ("area_id")
      REFERENCES "areas"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "appointments"
      ADD CONSTRAINT "FK_appointments_professional_id" FOREIGN KEY ("professional_id")
      REFERENCES "professionals"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "appointments"
      ADD CONSTRAINT "FK_appointments_service_id" FOREIGN KEY ("service_id")
      REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
    `);

    await queryRunner.query(`CREATE INDEX "IDX_professionals_area_id" ON "professionals" ("area_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_services_area_id" ON "services" ("area_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_appointments_professional_id" ON "appointments" ("professional_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_appointments_service_id" ON "appointments" ("service_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_appointments_start" ON "appointments" ("start")`);
    await queryRunner.query(`CREATE INDEX "IDX_appointments_end_at" ON "appointments" ("endAt")`);
    await queryRunner.query(`
      CREATE INDEX "IDX_appointments_professional_start"
      ON "appointments" ("professional_id", "start")
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "appointments"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "services"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "professionals"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "areas"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "appointments_status_enum"`);
  }
}
