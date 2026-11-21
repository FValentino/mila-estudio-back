import { DateTime } from 'luxon';
import { env } from '../../../shared/config/env.js';
import { ConflictError, NotFoundError } from '../../../shared/errors/domain-errors.js';
import { Appointment } from '../entities/appointment.entity.js';
import type { Professional } from '../../professionals/entities/professional.entity.js';
import type { ServiceOffering } from '../../services/entities/service.entity.js';
import {
  deleteAppointment,
  findAppointment,
  findAppointments,
  withAppointmentTransaction,
} from '../repositories/appointments.repository.js';
import type { AppointmentStore } from '../repositories/appointments.repository.js';
import { mapAppointmentToDto } from '../types/appointment.mapper.js';
import { AppointmentStatus } from '../types/appointment.types.js';
import type {
  AppointmentDto,
  CreateAppointmentInput,
  ListAppointmentsQuery,
  ReplaceAppointmentInput,
} from '../types/appointment.types.js';
import { assertNoOverlap, intervalIntersectsDay } from './overlap.js';
import type { AppointmentInterval } from './overlap.js';

const MINUTE_IN_MS = 60_000;

function activeAppointments(candidates: readonly Appointment[], excludeId?: string): Appointment[] {
  return candidates.filter(
    (appointment) => appointment.status !== AppointmentStatus.CANCELLED && appointment.id !== excludeId,
  );
}

function appointmentInterval(appointment: Appointment): AppointmentInterval {
  return { start: appointment.start, end: appointment.endAt };
}

function localDayBounds(date: string | undefined): AppointmentInterval | undefined {
  if (date === undefined) {
    return undefined;
  }
  const dayStart = DateTime.fromISO(date, { zone: env.TIMEZONE }).startOf('day');
  return {
    start: dayStart.toUTC().toJSDate(),
    end: dayStart.plus({ days: 1 }).toUTC().toJSDate(),
  };
}

interface ValidatedAppointmentRequest {
  professional: Professional;
  service: ServiceOffering;
  start: Date;
  endAt: Date;
}

async function validateAppointmentRequest(
  store: AppointmentStore,
  professionalId: string,
  serviceId: string,
  startInput: string,
  excludeId?: string,
): Promise<ValidatedAppointmentRequest> {
  const professional = await store.lockProfessional(professionalId);
  if (professional === null) {
    throw new NotFoundError(`Professional with id ${professionalId} was not found`);
  }

  const service = await store.findService(serviceId);
  if (service === null) {
    throw new NotFoundError(`Service with id ${serviceId} was not found`);
  }
  if (professional.areaId !== service.areaId) {
    throw new ConflictError('The service does not belong to the professional area');
  }

  const start = new Date(startInput);
  const endAt = new Date(start.getTime() + service.durationMinutes * MINUTE_IN_MS);
  const existing = await store.findOverlappingAppointments(professional.id, start, endAt, excludeId);
  assertNoOverlap(activeAppointments(existing, excludeId).map(appointmentInterval), { start, end: endAt });

  return { professional, service, start, endAt };
}

export async function listAppointments(query: ListAppointmentsQuery): Promise<AppointmentDto[]> {
  const day = localDayBounds(query.date);
  const appointments = await findAppointments({
    professionalId: query.professionalId,
    startFrom: day?.start,
    startTo: day?.end,
  });
  const matching = day === undefined
    ? appointments
    : appointments.filter((appointment) => intervalIntersectsDay(appointmentInterval(appointment), day.start, day.end));
  return matching.map(mapAppointmentToDto);
}

export async function getAppointment(id: string): Promise<AppointmentDto> {
  const appointment = await findAppointment(id);
  if (appointment === null) {
    throw new NotFoundError(`Appointment with id ${id} was not found`);
  }
  return mapAppointmentToDto(appointment);
}

export async function createAppointment(input: CreateAppointmentInput): Promise<AppointmentDto> {
  return withAppointmentTransaction(async (store) => {
    const { professional, service, start, endAt } = await validateAppointmentRequest(
      store,
      input.professionalId,
      input.serviceId,
      input.start,
    );

    const appointment = new Appointment();
    appointment.professional = professional;
    appointment.professionalId = professional.id;
    appointment.service = service;
    appointment.serviceId = service.id;
    appointment.start = start;
    appointment.endAt = endAt;
    appointment.clientName = input.clientName;
    appointment.clientPhone = input.clientPhone;
    appointment.clientEmail = input.clientEmail ?? null;
    appointment.notes = input.notes ?? null;
    appointment.status = AppointmentStatus.CONFIRMED;

    return mapAppointmentToDto(await store.saveAppointment(appointment));
  });
}

export async function replaceAppointment(
  id: string,
  input: ReplaceAppointmentInput,
): Promise<AppointmentDto> {
  return withAppointmentTransaction(async (store) => {
    const appointment = await store.findAppointmentById(id);
    if (appointment === null) {
      throw new NotFoundError(`Appointment with id ${id} was not found`);
    }

    const { professional, service, start, endAt } = await validateAppointmentRequest(
      store,
      input.professionalId,
      input.serviceId,
      input.start,
      id,
    );

    appointment.professional = professional;
    appointment.professionalId = professional.id;
    appointment.service = service;
    appointment.serviceId = service.id;
    appointment.start = start;
    appointment.endAt = endAt;
    appointment.clientName = input.clientName;
    appointment.clientPhone = input.clientPhone;
    appointment.clientEmail = input.clientEmail ?? null;
    appointment.notes = input.notes ?? null;
    appointment.status = input.status;

    return mapAppointmentToDto(await store.saveAppointment(appointment));
  });
}

export async function updateAppointmentStatus(id: string, status: AppointmentStatus): Promise<AppointmentDto> {
  return withAppointmentTransaction(async (store) => {
    const initial = await store.findAppointmentById(id);
    if (initial === null) {
      throw new NotFoundError(`Appointment with id ${id} was not found`);
    }

    const professional = await store.lockProfessional(initial.professionalId);
    if (professional === null) {
      throw new NotFoundError(`Professional with id ${initial.professionalId} was not found`);
    }

    const appointment = await store.findAppointmentById(id);
    if (appointment === null) {
      throw new NotFoundError(`Appointment with id ${id} was not found`);
    }

    if (appointment.status !== status) {
      if (status === AppointmentStatus.CONFIRMED) {
        const existing = await store.findOverlappingAppointments(
          appointment.professionalId,
          appointment.start,
          appointment.endAt,
          appointment.id,
        );
        assertNoOverlap(activeAppointments(existing, appointment.id).map(appointmentInterval), {
          start: appointment.start,
          end: appointment.endAt,
        });
      }
      appointment.status = status;
      await store.saveAppointment(appointment);
    }
    return mapAppointmentToDto(appointment);
  });
}

export async function removeAppointment(id: string): Promise<void> {
  const deleted = await deleteAppointment(id);
  if (!deleted) {
    throw new NotFoundError(`Appointment with id ${id} was not found`);
  }
}
