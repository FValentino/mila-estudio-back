import 'reflect-metadata';
import bcrypt from 'bcrypt';
import { Area } from '../../features/areas/entities/area.entity.js';
import { saveArea } from '../../features/areas/repositories/areas.repository.js';
import { Appointment } from '../../features/appointments/entities/appointment.entity.js';
import { Professional } from '../../features/professionals/entities/professional.entity.js';
import { saveProfessional } from '../../features/professionals/repositories/professionals.repository.js';
import { ServiceOffering } from '../../features/services/entities/service.entity.js';
import { saveService } from '../../features/services/repositories/services.repository.js';
import { create as saveUser, findByEmail } from '../../features/users/repositories/users.repository.js';
import { env } from '../config/env.js';
import { dataSource } from './data-source.js';
import { SALT_ROUNDS } from './seed-admin.logic.js';
import { seedDemo } from './seed-demo.logic.js';

async function main(): Promise<void> {
  await dataSource.initialize();
  try {
    const result = await seedDemo({
      now: new Date(),
      timezone: env.TIMEZONE,
      findUserByEmail: findByEmail,
      saveUser,
      findAreaByName: (name) => dataSource.getRepository(Area).findOne({ where: { name } }),
      saveArea,
      findProfessionalByName: (firstName, lastName) =>
        dataSource.getRepository(Professional).findOne({ where: { firstName, lastName } }),
      saveProfessional,
      findServiceByName: (name) => dataSource.getRepository(ServiceOffering).findOne({ where: { name } }),
      saveService,
      findAppointmentByClientEmail: (clientEmail) =>
        dataSource.getRepository(Appointment).findOne({ where: { clientEmail } }),
      saveAppointment: (appointment) => dataSource.getRepository(Appointment).save(appointment),
      hashPassword: (password) => bcrypt.hash(password, SALT_ROUNDS),
    });

    console.log(
      `Demo data ready: ${result.users.length} users, ${result.areas.length} areas, ` +
        `${result.professionals.length} professionals, ${result.services.length} services, ` +
        `${result.appointments.length} appointments.`,
    );
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

main().catch((error: unknown) => {
  console.error('Failed to seed demo data', error);
  process.exitCode = 1;
});
