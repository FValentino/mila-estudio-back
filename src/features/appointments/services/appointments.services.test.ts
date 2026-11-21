import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConflictError, NotFoundError } from '../../../shared/errors/domain-errors.js';
import { Professional } from '../../professionals/entities/professional.entity.js';
import { ServiceOffering } from '../../services/entities/service.entity.js';
import { Appointment } from '../entities/appointment.entity.js';
import {
  deleteAppointment,
  findAppointment,
  findAppointments,
  withAppointmentTransaction,
} from '../repositories/appointments.repository.js';
import type { AppointmentStore } from '../repositories/appointments.repository.js';
import type { CreateAppointmentInput } from '../types/appointment.types.js';
import { AppointmentStatus } from '../types/appointment.types.js';
import { createAppointment, listAppointments, updateAppointmentStatus } from './appointments.services.js';

vi.mock('../repositories/appointments.repository.js', () => ({
  withAppointmentTransaction: vi.fn(),
  findAppointments: vi.fn(),
  findAppointment: vi.fn(),
  deleteAppointment: vi.fn(),
}));

const envMock = vi.hoisted(() => ({ TIMEZONE: 'America/Argentina/Buenos_Aires' }));

vi.mock('../../../shared/config/env.js', () => ({ env: envMock }));

const AREA_ID = '11111111-1111-4111-8111-111111111111';
const OTHER_AREA_ID = '11111111-1111-4111-8111-222222222222';
const PROFESSIONAL_ID = '22222222-2222-4222-8222-222222222222';
const SERVICE_ID = '33333333-3333-4333-8333-333333333333';
const APPOINTMENT_ID = '44444444-4444-4444-8444-444444444444';
const START = new Date('2026-11-20T10:00:00.000Z');
const DURATION_MINUTES = 45;
const END_AT = new Date(START.getTime() + DURATION_MINUTES * 60_000);
const CREATED_AT = new Date('2026-11-19T09:00:00.000Z');

const createInput: CreateAppointmentInput = {
  professionalId: PROFESSIONAL_ID,
  serviceId: SERVICE_ID,
  start: START.toISOString(),
  clientName: 'Ana Pérez',
  clientPhone: '+54 9 11 5555 5555',
  clientEmail: null,
  notes: null,
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
  service.durationMinutes = DURATION_MINUTES;
  service.createdAt = CREATED_AT;
  service.updatedAt = CREATED_AT;
  return service;
}

function makeAppointment(status: AppointmentStatus = AppointmentStatus.CONFIRMED): Appointment {
  const appointment = new Appointment();
  appointment.id = APPOINTMENT_ID;
  appointment.professionalId = PROFESSIONAL_ID;
  appointment.serviceId = SERVICE_ID;
  appointment.start = START;
  appointment.endAt = END_AT;
  appointment.clientName = 'Ana Pérez';
  appointment.clientPhone = '+54 9 11 5555 5555';
  appointment.clientEmail = null;
  appointment.notes = null;
  appointment.status = status;
  appointment.createdAt = CREATED_AT;
  appointment.updatedAt = CREATED_AT;
  return appointment;
}

function makeAppointmentInInterval(start: Date, endAt: Date): Appointment {
  const appointment = makeAppointment();
  appointment.start = start;
  appointment.endAt = endAt;
  return appointment;
}

function makeStore(overrides: Partial<AppointmentStore> = {}): AppointmentStore {
  return {
    lockProfessional: vi.fn(async () => makeProfessional()),
    findService: vi.fn(async () => makeService()),
    findAppointmentById: vi.fn(async () => makeAppointment()),
    findOverlappingAppointments: vi.fn(async () => []),
    saveAppointment: vi.fn(async (appointment: Appointment) => {
      appointment.id = APPOINTMENT_ID;
      appointment.createdAt = CREATED_AT;
      appointment.updatedAt = CREATED_AT;
      return appointment;
    }),
    ...overrides,
  };
}

function useStore(store: AppointmentStore): void {
  vi.mocked(withAppointmentTransaction).mockImplementation(async (work) => work(store));
}

let store: AppointmentStore;

beforeEach(() => {
  vi.clearAllMocks();
  envMock.TIMEZONE = 'America/Argentina/Buenos_Aires';
  store = makeStore();
  useStore(store);
  vi.mocked(findAppointments).mockResolvedValue([]);
  vi.mocked(findAppointment).mockResolvedValue(null);
  vi.mocked(deleteAppointment).mockResolvedValue(false);
});

describe('createAppointment transactional orchestration', () => {
  it('locks the professional, checks overlap and writes inside a single transaction', async () => {
    await createAppointment(createInput);

    expect(withAppointmentTransaction).toHaveBeenCalledTimes(1);
    expect(store.lockProfessional).toHaveBeenCalledWith(PROFESSIONAL_ID);
    expect(store.findService).toHaveBeenCalledWith(SERVICE_ID);
    expect(store.saveAppointment).toHaveBeenCalledTimes(1);

    const lockOrder = vi.mocked(store.lockProfessional).mock.invocationCallOrder[0] ?? 0;
    const saveOrder = vi.mocked(store.saveAppointment).mock.invocationCallOrder[0] ?? 0;
    expect(lockOrder).toBeLessThan(saveOrder);
  });

  it('rejects a service from a different area', async () => {
    const otherAreaStore = makeStore({ findService: vi.fn(async () => makeService(OTHER_AREA_ID)) });
    useStore(otherAreaStore);

    await expect(createAppointment(createInput)).rejects.toBeInstanceOf(ConflictError);
    expect(otherAreaStore.saveAppointment).not.toHaveBeenCalled();
  });

  it('computes the end from the service duration', async () => {
    const dto = await createAppointment(createInput);

    expect(dto.start).toBe(START.toISOString());
    expect(dto.endAt).toBe(END_AT.toISOString());
  });

  it('does not block a slot when the overlapping appointment is cancelled', async () => {
    const cancelled = makeAppointment(AppointmentStatus.CANCELLED);
    const cancelledStore = makeStore({
      findOverlappingAppointments: vi.fn(async () => [cancelled]),
    });
    useStore(cancelledStore);

    await expect(createAppointment(createInput)).resolves.toMatchObject({ status: AppointmentStatus.CONFIRMED });
    expect(cancelledStore.saveAppointment).toHaveBeenCalledTimes(1);
  });

  it('returns 404 when the professional does not exist', async () => {
    const emptyStore = makeStore({ lockProfessional: vi.fn(async () => null) });
    useStore(emptyStore);

    await expect(createAppointment(createInput)).rejects.toBeInstanceOf(NotFoundError);
    expect(emptyStore.saveAppointment).not.toHaveBeenCalled();
  });

  it('returns 404 when the service does not exist', async () => {
    const emptyStore = makeStore({ findService: vi.fn(async () => null) });
    useStore(emptyStore);

    await expect(createAppointment(createInput)).rejects.toBeInstanceOf(NotFoundError);
    expect(emptyStore.saveAppointment).not.toHaveBeenCalled();
  });

  it('returns 409 when an active appointment overlaps', async () => {
    const overlapping = makeAppointment();
    const busyStore = makeStore({
      findOverlappingAppointments: vi.fn(async () => [overlapping]),
    });
    useStore(busyStore);

    await expect(createAppointment(createInput)).rejects.toBeInstanceOf(ConflictError);
    expect(busyStore.saveAppointment).not.toHaveBeenCalled();
  });
});

describe('updateAppointmentStatus', () => {
  it('excludes the appointment itself when re-confirming', async () => {
    const cancelled = makeAppointment(AppointmentStatus.CANCELLED);
    const confirmStore = makeStore({
      findAppointmentById: vi.fn(async () => cancelled),
      findOverlappingAppointments: vi.fn(async () => [cancelled]),
    });
    useStore(confirmStore);

    const dto = await updateAppointmentStatus(APPOINTMENT_ID, AppointmentStatus.CONFIRMED);

    expect(withAppointmentTransaction).toHaveBeenCalledTimes(1);
    expect(confirmStore.findOverlappingAppointments).toHaveBeenCalledWith(
      PROFESSIONAL_ID,
      START,
      END_AT,
      APPOINTMENT_ID,
    );
    expect(dto.status).toBe(AppointmentStatus.CONFIRMED);
    expect(confirmStore.saveAppointment).toHaveBeenCalledTimes(1);
  });

  it('returns 404 when the appointment does not exist', async () => {
    const emptyStore = makeStore({ findAppointmentById: vi.fn(async () => null) });
    useStore(emptyStore);

    await expect(updateAppointmentStatus(APPOINTMENT_ID, AppointmentStatus.CANCELLED)).rejects.toBeInstanceOf(
      NotFoundError,
    );
    expect(emptyStore.saveAppointment).not.toHaveBeenCalled();
  });
});

describe('listAppointments', () => {
  const LOCAL_DAY_START = new Date('2026-11-20T03:00:00.000Z');
  const NEXT_LOCAL_DAY_START = new Date('2026-11-21T03:00:00.000Z');

  it('filters by professional and local day boundaries', async () => {
    vi.mocked(findAppointments).mockResolvedValue([makeAppointment()]);

    const dtos = await listAppointments({ professionalId: PROFESSIONAL_ID, date: '2026-11-20' });

    expect(findAppointments).toHaveBeenCalledWith({
      professionalId: PROFESSIONAL_ID,
      startFrom: LOCAL_DAY_START,
      startTo: NEXT_LOCAL_DAY_START,
    });
    expect(dtos).toHaveLength(1);
    expect(dtos[0]?.professionalId).toBe(PROFESSIONAL_ID);
  });

  it('includes an appointment crossing local midnight in both adjacent days', async () => {
    const crossing = makeAppointmentInInterval(
      new Date('2026-11-21T02:30:00.000Z'),
      new Date('2026-11-21T03:30:00.000Z'),
    );
    vi.mocked(findAppointments).mockResolvedValue([crossing]);

    const previousDay = await listAppointments({ professionalId: PROFESSIONAL_ID, date: '2026-11-20' });
    const nextDay = await listAppointments({ professionalId: PROFESSIONAL_ID, date: '2026-11-21' });

    expect(previousDay).toHaveLength(1);
    expect(nextDay).toHaveLength(1);
  });

  it('excludes an appointment ending exactly at the next local midnight', async () => {
    const endingAtMidnight = makeAppointmentInInterval(
      new Date('2026-11-20T22:00:00.000Z'),
      NEXT_LOCAL_DAY_START,
    );
    vi.mocked(findAppointments).mockResolvedValue([endingAtMidnight]);

    await expect(listAppointments({ date: '2026-11-21' })).resolves.toHaveLength(0);
  });

  it('leaves date boundaries undefined when no date is provided', async () => {
    await listAppointments({ professionalId: undefined, date: undefined });

    expect(findAppointments).toHaveBeenCalledWith({
      professionalId: undefined,
      startFrom: undefined,
      startTo: undefined,
    });
  });

  it.each([
    ['2026-03-08', new Date('2026-03-08T05:00:00.000Z'), new Date('2026-03-09T04:00:00.000Z'), 23],
    ['2026-11-01', new Date('2026-11-01T04:00:00.000Z'), new Date('2026-11-02T05:00:00.000Z'), 25],
  ])('uses the real %s day length in America/New_York', async (date, startFrom, startTo, hours) => {
    envMock.TIMEZONE = 'America/New_York';

    await listAppointments({ date });

    expect(findAppointments).toHaveBeenCalledWith({
      professionalId: undefined,
      startFrom,
      startTo,
    });
    expect(startTo.getTime() - startFrom.getTime()).toBe(hours * 3_600_000);
  });
});
