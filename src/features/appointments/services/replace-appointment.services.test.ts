import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConflictError } from '../../../shared/errors/domain-errors.js';
import { Professional } from '../../professionals/entities/professional.entity.js';
import { ServiceOffering } from '../../services/entities/service.entity.js';
import { Appointment } from '../entities/appointment.entity.js';
import {
  withAppointmentTransaction,
} from '../repositories/appointments.repository.js';
import type { AppointmentStore } from '../repositories/appointments.repository.js';
import { AppointmentStatus } from '../types/appointment.types.js';
import type { ReplaceAppointmentInput } from '../types/appointment.types.js';
import { replaceAppointment } from './appointments.services.js';

vi.mock('../../../shared/config/env.js', () => ({ env: { TIMEZONE: 'America/Argentina/Buenos_Aires' } }));
vi.mock('../repositories/appointments.repository.js', () => ({
  withAppointmentTransaction: vi.fn(),
  findAppointments: vi.fn(),
  findAppointment: vi.fn(),
  deleteAppointment: vi.fn(),
}));

const APPOINTMENT_ID = '44444444-4444-4444-8444-444444444444';
const OTHER_ID = '44444444-4444-4444-8444-999999999999';
const AREA_ID = '11111111-1111-4111-8111-111111111111';
const OTHER_AREA_ID = '11111111-1111-4111-8111-222222222222';
const PROFESSIONAL_ID = '22222222-2222-4222-8222-222222222222';
const SERVICE_ID = '33333333-3333-4333-8333-333333333333';
const START = new Date('2026-11-20T10:00:00.000Z');
const END_AT = new Date('2026-11-20T10:45:00.000Z');
const CREATED_AT = new Date('2026-11-19T09:00:00.000Z');

const input: ReplaceAppointmentInput = {
  professionalId: PROFESSIONAL_ID,
  serviceId: SERVICE_ID,
  start: START.toISOString(),
  clientName: 'Ana Pérez',
  clientPhone: '+54 9 11 5555 5555',
  clientEmail: null,
  notes: null,
  status: AppointmentStatus.CONFIRMED,
};

function makeProfessional(areaId: string = AREA_ID): Professional {
  const professional = new Professional();
  professional.id = PROFESSIONAL_ID;
  professional.areaId = areaId;
  professional.firstName = 'Ana';
  professional.lastName = 'Pérez';
  professional.createdAt = CREATED_AT;
  professional.updatedAt = CREATED_AT;
  return professional;
}

function makeService(areaId: string = AREA_ID): ServiceOffering {
  const service = new ServiceOffering();
  service.id = SERVICE_ID;
  service.areaId = areaId;
  service.name = 'Manicuría básica';
  service.durationMinutes = 45;
  service.price = '1500.00';
  service.createdAt = CREATED_AT;
  service.updatedAt = CREATED_AT;
  return service;
}

function makeAppointment(id: string = APPOINTMENT_ID): Appointment {
  const appointment = new Appointment();
  appointment.id = id;
  appointment.professionalId = PROFESSIONAL_ID;
  appointment.serviceId = SERVICE_ID;
  appointment.start = START;
  appointment.endAt = END_AT;
  appointment.clientName = 'Old Name';
  appointment.clientPhone = '+54 9 11 0000 0000';
  appointment.clientEmail = null;
  appointment.notes = null;
  appointment.status = AppointmentStatus.CONFIRMED;
  appointment.createdAt = CREATED_AT;
  appointment.updatedAt = CREATED_AT;
  return appointment;
}

function makeStore(overrides: Partial<AppointmentStore> = {}): AppointmentStore {
  return {
    lockProfessional: vi.fn(async () => makeProfessional()),
    findService: vi.fn(async () => makeService()),
    findAppointmentById: vi.fn(async () => makeAppointment()),
    findOverlappingAppointments: vi.fn(async () => []),
    saveAppointment: vi.fn(async (appointment: Appointment) => appointment),
    ...overrides,
  };
}

function useStore(store: AppointmentStore): void {
  vi.mocked(withAppointmentTransaction).mockImplementation(async (work) => work(store));
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('replaceAppointment', () => {
  it('revalidates inside the transaction and recomputes endAt', async () => {
    const store = makeStore();
    useStore(store);

    const dto = await replaceAppointment(APPOINTMENT_ID, input);

    expect(withAppointmentTransaction).toHaveBeenCalledTimes(1);
    expect(store.lockProfessional).toHaveBeenCalledWith(PROFESSIONAL_ID);
    expect(store.findOverlappingAppointments).toHaveBeenCalledWith(
      PROFESSIONAL_ID,
      START,
      END_AT,
      APPOINTMENT_ID,
    );
    expect(store.saveAppointment).toHaveBeenCalledTimes(1);
    const saved = vi.mocked(store.saveAppointment).mock.calls[0]?.[0];
    expect(saved?.endAt).toEqual(END_AT);
    expect(saved?.clientName).toBe('Ana Pérez');
    expect(saved?.status).toBe(AppointmentStatus.CONFIRMED);
    expect(dto.endAt).toBe(END_AT.toISOString());
  });

  it('rejects a service from a different area', async () => {
    const store = makeStore({ findService: vi.fn(async () => makeService(OTHER_AREA_ID)) });
    useStore(store);

    await expect(replaceAppointment(APPOINTMENT_ID, input)).rejects.toBeInstanceOf(ConflictError);
    expect(store.saveAppointment).not.toHaveBeenCalled();
  });

  it('rejects an overlap excluding its own id', async () => {
    const store = makeStore({
      findOverlappingAppointments: vi.fn(async () => [makeAppointment(OTHER_ID)]),
    });
    useStore(store);

    await expect(replaceAppointment(APPOINTMENT_ID, input)).rejects.toBeInstanceOf(ConflictError);
    expect(store.findOverlappingAppointments).toHaveBeenCalledWith(
      PROFESSIONAL_ID,
      START,
      END_AT,
      APPOINTMENT_ID,
    );
    expect(store.saveAppointment).not.toHaveBeenCalled();
  });
});
