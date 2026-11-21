import 'reflect-metadata';
import { DataSource } from 'typeorm';
import type { DataSourceOptions } from 'typeorm';
import { env } from '../config/env.js';
import { Appointment } from '../../features/appointments/entities/appointment.entity.js';
import { Area } from '../../features/areas/entities/area.entity.js';
import { Professional } from '../../features/professionals/entities/professional.entity.js';
import { ServiceOffering } from '../../features/services/entities/service.entity.js';
import { InitialSchema1763640000000 } from './migrations/1763640000000-InitialSchema.js';

function postgresConnection(): DataSourceOptions {
  if (env.DATABASE_URL !== undefined) {
    return { type: 'postgres', url: env.DATABASE_URL };
  }

  const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = env;
  if (
    DB_HOST === undefined
    || DB_PORT === undefined
    || DB_USER === undefined
    || DB_PASSWORD === undefined
    || DB_NAME === undefined
  ) {
    throw new Error('Database variables are required when DATABASE_URL is not set');
  }

  return {
    type: 'postgres',
    host: DB_HOST,
    port: DB_PORT,
    username: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
  };
}

const connection = postgresConnection();

export const dataSource = new DataSource({
  ...connection,
  entities: [Area, Professional, ServiceOffering, Appointment],
  migrations: [InitialSchema1763640000000],
  synchronize: false,
  logging: false,
});
