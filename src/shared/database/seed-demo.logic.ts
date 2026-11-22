import { DateTime } from 'luxon';
import { Area } from '../../features/areas/entities/area.entity.js';
import { Appointment } from '../../features/appointments/entities/appointment.entity.js';
import { AppointmentStatus } from '../../features/appointments/types/appointment.types.js';
import { Professional } from '../../features/professionals/entities/professional.entity.js';
import { ServiceOffering } from '../../features/services/entities/service.entity.js';
import { User } from '../../features/users/entities/user.entity.js';
import type { UserRole } from '../../features/users/types/user.types.js';
import { seedAdmin } from './seed-admin.logic.js';

export const DEMO_ADMIN_EMAIL = 'admin@mila.test';
export const DEMO_ADMIN_PASSWORD = 'AdminDemo123!';
export const DEMO_USER_EMAIL = 'user@mila.test';
export const DEMO_USER_PASSWORD = 'UserDemo123!';

const MINUTE_IN_MS = 60_000;

export interface SeedDemoDeps {
  now: Date;
  timezone: string;
  findUserByEmail: (email: string) => Promise<User | null>;
  saveUser: (user: User) => Promise<User>;
  findAreaByName: (name: string) => Promise<Area | null>;
  saveArea: (area: Area) => Promise<Area>;
  findProfessionalByName: (firstName: string, lastName: string) => Promise<Professional | null>;
  saveProfessional: (professional: Professional) => Promise<Professional>;
  findServiceByName: (name: string) => Promise<ServiceOffering | null>;
  saveService: (service: ServiceOffering) => Promise<ServiceOffering>;
  findAppointmentByClientEmail: (clientEmail: string) => Promise<Appointment | null>;
  saveAppointment: (appointment: Appointment) => Promise<Appointment>;
  hashPassword: (password: string) => Promise<string>;
}

export interface SeedDemoResult {
  users: User[];
  areas: Area[];
  professionals: Professional[];
  services: ServiceOffering[];
  appointments: Appointment[];
}

interface AreaSpec {
  name: string;
  description: string;
}

interface ProfessionalSpec {
  firstName: string;
  lastName: string;
  areaIndex: number;
}

interface ServiceSpec {
  name: string;
  durationMinutes: number;
  price: string;
  areaIndex: number;
}

interface AppointmentSpec {
  clientEmail: string;
  clientName: string;
  clientPhone: string;
  daysFromToday: number;
  hour: number;
  minute: number;
  professionalIndex: number;
  serviceIndex: number;
  status: AppointmentStatus;
  notes: string | null;
}

const AREA_SPECS: readonly AreaSpec[] = [
  { name: 'Demo Manicuría', description: 'Área demo de cuidado de uñas.' },
  { name: 'Demo Masajes', description: 'Área demo de tratamientos de relajación.' },
];

const PROFESSIONAL_SPECS: readonly ProfessionalSpec[] = [
  { firstName: 'Demo Ana', lastName: 'Pérez', areaIndex: 0 },
  { firstName: 'Demo Lucía', lastName: 'Gómez', areaIndex: 1 },
];

const SERVICE_SPECS: readonly ServiceSpec[] = [
  { name: 'Demo Manicuría básica', durationMinutes: 45, price: '1500.00', areaIndex: 0 },
  { name: 'Demo Masaje relajante', durationMinutes: 60, price: '2500.00', areaIndex: 1 },
];

const APPOINTMENT_SPECS: readonly AppointmentSpec[] = [
  {
    clientEmail: 'demo-turno-1@mila.test',
    clientName: 'Demo Clienta 1',
    clientPhone: '+54 9 11 5555 0001',
    daysFromToday: 1,
    hour: 10,
    minute: 0,
    professionalIndex: 0,
    serviceIndex: 0,
    status: AppointmentStatus.CONFIRMED,
    notes: 'Turno demo confirmado.',
  },
  {
    clientEmail: 'demo-turno-2@mila.test',
    clientName: 'Demo Clienta 2',
    clientPhone: '+54 9 11 5555 0002',
    daysFromToday: 2,
    hour: 11,
    minute: 30,
    professionalIndex: 0,
    serviceIndex: 0,
    status: AppointmentStatus.CONFIRMED,
    notes: null,
  },
  {
    clientEmail: 'demo-turno-3@mila.test',
    clientName: 'Demo Clienta 3',
    clientPhone: '+54 9 11 5555 0003',
    daysFromToday: 1,
    hour: 15,
    minute: 0,
    professionalIndex: 1,
    serviceIndex: 1,
    status: AppointmentStatus.CONFIRMED,
    notes: 'Turno demo confirmado.',
  },
  {
    clientEmail: 'demo-turno-4@mila.test',
    clientName: 'Demo Clienta 4',
    clientPhone: '+54 9 11 5555 0004',
    daysFromToday: 3,
    hour: 9,
    minute: 30,
    professionalIndex: 1,
    serviceIndex: 1,
    status: AppointmentStatus.CANCELLED,
    notes: 'Turno demo cancelado.',
  },
];

function localStart(deps: SeedDemoDeps, daysFromToday: number, hour: number, minute: number): Date {
  return DateTime.fromJSDate(deps.now, { zone: deps.timezone })
    .plus({ days: daysFromToday })
    .set({ hour, minute, second: 0, millisecond: 0 })
    .toUTC()
    .toJSDate();
}

async function upsertUser(
  deps: SeedDemoDeps,
  email: string,
  password: string,
  role: UserRole,
): Promise<User> {
  const existing = await deps.findUserByEmail(email);
  const user = existing ?? new User();
  user.email = email;
  user.passwordHash = await deps.hashPassword(password);
  user.role = role;
  return deps.saveUser(user);
}

async function upsertAreas(deps: SeedDemoDeps): Promise<Area[]> {
  const areas: Area[] = [];
  for (const spec of AREA_SPECS) {
    const existing = await deps.findAreaByName(spec.name);
    const area = existing ?? new Area();
    area.name = spec.name;
    area.description = spec.description;
    areas.push(await deps.saveArea(area));
  }
  return areas;
}

async function upsertProfessionals(deps: SeedDemoDeps, areas: readonly Area[]): Promise<Professional[]> {
  const professionals: Professional[] = [];
  for (const spec of PROFESSIONAL_SPECS) {
    const existing = await deps.findProfessionalByName(spec.firstName, spec.lastName);
    const professional = existing ?? new Professional();
    professional.firstName = spec.firstName;
    professional.lastName = spec.lastName;
    professional.area = areas[spec.areaIndex] as Area;
    professionals.push(await deps.saveProfessional(professional));
  }
  return professionals;
}

async function upsertServices(deps: SeedDemoDeps, areas: readonly Area[]): Promise<ServiceOffering[]> {
  const services: ServiceOffering[] = [];
  for (const spec of SERVICE_SPECS) {
    const existing = await deps.findServiceByName(spec.name);
    const service = existing ?? new ServiceOffering();
    service.name = spec.name;
    service.durationMinutes = spec.durationMinutes;
    service.price = spec.price;
    service.area = areas[spec.areaIndex] as Area;
    services.push(await deps.saveService(service));
  }
  return services;
}

async function upsertAppointments(
  deps: SeedDemoDeps,
  professionals: readonly Professional[],
  services: readonly ServiceOffering[],
): Promise<Appointment[]> {
  const appointments: Appointment[] = [];
  for (const spec of APPOINTMENT_SPECS) {
    const service = services[spec.serviceIndex] as ServiceOffering;
    const start = localStart(deps, spec.daysFromToday, spec.hour, spec.minute);
    const existing = await deps.findAppointmentByClientEmail(spec.clientEmail);
    const appointment = existing ?? new Appointment();
    appointment.professional = professionals[spec.professionalIndex] as Professional;
    appointment.professionalId = appointment.professional.id;
    appointment.service = service;
    appointment.serviceId = service.id;
    appointment.start = start;
    appointment.endAt = new Date(start.getTime() + service.durationMinutes * MINUTE_IN_MS);
    appointment.clientName = spec.clientName;
    appointment.clientPhone = spec.clientPhone;
    appointment.clientEmail = spec.clientEmail;
    appointment.notes = spec.notes;
    appointment.status = spec.status;
    appointments.push(await deps.saveAppointment(appointment));
  }
  return appointments;
}

export async function seedDemo(deps: SeedDemoDeps): Promise<SeedDemoResult> {
  const admin = await seedAdmin({
    email: DEMO_ADMIN_EMAIL,
    password: DEMO_ADMIN_PASSWORD,
    findByEmail: deps.findUserByEmail,
    create: deps.saveUser,
    hashPassword: deps.hashPassword,
  });
  const regularUser = await upsertUser(deps, DEMO_USER_EMAIL, DEMO_USER_PASSWORD, 'user');
  const areas = await upsertAreas(deps);
  const professionals = await upsertProfessionals(deps, areas);
  const services = await upsertServices(deps, areas);
  const appointments = await upsertAppointments(deps, professionals, services);

  return {
    users: [admin, regularUser],
    areas,
    professionals,
    services,
    appointments,
  };
}
