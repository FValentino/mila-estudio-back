import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { env } from '../config/env.js';
import { Appointment } from '../../features/appointments/entities/appointment.entity.js';
import { Area } from '../../features/areas/entities/area.entity.js';
import { Professional } from '../../features/professionals/entities/professional.entity.js';
import { ServiceOffering } from '../../features/services/entities/service.entity.js';
import { User } from '../../features/users/entities/user.entity.js';
import { InitialSchema1763640000000 } from './migrations/1763640000000-InitialSchema.js';
import { AddUsers1763650000000 } from './migrations/1763650000000-AddUsers.js';

export const dataSource = new DataSource({
  type: 'postgres',
  url: env.DATABASE_URL,
  entities: [Area, Professional, ServiceOffering, Appointment, User],
  migrations: [InitialSchema1763640000000, AddUsers1763650000000],
  synchronize: false,
  logging: false,
});
