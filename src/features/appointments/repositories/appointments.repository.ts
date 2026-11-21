import { LessThan, MoreThan, Not } from 'typeorm';
import type { EntityManager, FindOptionsWhere, Repository } from 'typeorm';
import { dataSource } from '../../../shared/database/data-source.js';
import { Professional } from '../../professionals/entities/professional.entity.js';
import { ServiceOffering } from '../../services/entities/service.entity.js';
import { AppointmentStatus } from '../types/appointment.types.js';
import { Appointment } from '../entities/appointment.entity.js';

export interface AppointmentFilters {
  professionalId: string | undefined;
  startFrom: Date | undefined;
  startTo: Date | undefined;
}

export interface AppointmentStore {
  lockProfessional(id: string): Promise<Professional | null>;
  findService(id: string): Promise<ServiceOffering | null>;
  findAppointmentById(id: string): Promise<Appointment | null>;
  findOverlappingAppointments(
    professionalId: string,
    start: Date,
    endAt: Date,
    excludeId?: string,
  ): Promise<Appointment[]>;
  saveAppointment(appointment: Appointment): Promise<Appointment>;
}

const EMPTY_FILTERS: AppointmentFilters = {
  professionalId: undefined,
  startFrom: undefined,
  startTo: undefined,
};

function appointmentRepository(): Repository<Appointment> {
  return dataSource.getRepository(Appointment);
}

function lockProfessional(manager: EntityManager, id: string): Promise<Professional | null> {
  return manager.findOne(Professional, {
    where: { id },
    lock: { mode: 'pessimistic_write' },
  });
}

function findService(manager: EntityManager, id: string): Promise<ServiceOffering | null> {
  return manager.findOne(ServiceOffering, { where: { id } });
}

function findAppointmentById(manager: EntityManager, id: string): Promise<Appointment | null> {
  return manager.findOne(Appointment, { where: { id } });
}

function findOverlappingAppointments(
  manager: EntityManager,
  professionalId: string,
  start: Date,
  endAt: Date,
  excludeId?: string,
): Promise<Appointment[]> {
  const where: FindOptionsWhere<Appointment> = {
    professional: { id: professionalId },
    status: Not(AppointmentStatus.CANCELLED),
    start: LessThan(endAt),
    endAt: MoreThan(start),
  };
  if (excludeId !== undefined) {
    where.id = Not(excludeId);
  }
  return manager.find(Appointment, { where, order: { start: 'ASC' } });
}

function saveAppointment(manager: EntityManager, appointment: Appointment): Promise<Appointment> {
  return manager.save(Appointment, appointment);
}

export function createAppointmentStore(manager: EntityManager): AppointmentStore {
  return {
    lockProfessional: (id) => lockProfessional(manager, id),
    findService: (id) => findService(manager, id),
    findAppointmentById: (id) => findAppointmentById(manager, id),
    findOverlappingAppointments: (id, start, endAt, excludeId) =>
      findOverlappingAppointments(manager, id, start, endAt, excludeId),
    saveAppointment: (appointment) => saveAppointment(manager, appointment),
  };
}

export async function withAppointmentTransaction<T>(work: (store: AppointmentStore) => Promise<T>): Promise<T> {
  return dataSource.manager.transaction((manager) => work(createAppointmentStore(manager)));
}

export async function findAppointments(filters: AppointmentFilters = EMPTY_FILTERS): Promise<Appointment[]> {
  const where: FindOptionsWhere<Appointment> = {};

  if (filters.professionalId !== undefined) {
    where.professional = { id: filters.professionalId };
  }
  if (filters.startFrom !== undefined && filters.startTo !== undefined) {
    where.start = LessThan(filters.startTo);
    where.endAt = MoreThan(filters.startFrom);
  }

  return appointmentRepository().find({ where, order: { start: 'ASC' } });
}

export async function findAppointment(id: string): Promise<Appointment | null> {
  return appointmentRepository().findOne({ where: { id } });
}

export async function deleteAppointment(id: string): Promise<boolean> {
  const result = await appointmentRepository().delete({ id });
  return (result.affected ?? 0) > 0;
}
