import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { env } from '../config/env.js';
import { Appointment } from '../../features/appointments/entities/appointment.entity.js';
import { Area } from '../../features/areas/entities/area.entity.js';
import { Professional } from '../../features/professionals/entities/professional.entity.js';
import { ServiceOffering } from '../../features/services/entities/service.entity.js';
import { InitialSchema1763640000000 } from './migrations/1763640000000-InitialSchema.js';

export const dataSource = new DataSource({
  type: 'postgres',
  host: env.DB_HOST,
  port: env.DB_PORT,
  username: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  entities: [Area, Professional, ServiceOffering, Appointment],
  migrations: [InitialSchema1763640000000],
  synchronize: false,
  logging: false,
});
