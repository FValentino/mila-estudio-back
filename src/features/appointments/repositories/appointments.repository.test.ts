import { FindOperator } from 'typeorm';
import type { FindOptionsWhere } from 'typeorm';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Appointment } from '../entities/appointment.entity.js';
import { findAppointments } from './appointments.repository.js';

const repositoryMock = vi.hoisted(() => ({ find: vi.fn() }));

vi.mock('../../../shared/database/data-source.js', () => ({
  dataSource: { getRepository: () => ({ find: repositoryMock.find }) },
}));

interface AppointmentTimes {
  id: string;
  start: Date;
  endAt: Date;
}

interface RepositoryFindOptions {
  where: FindOptionsWhere<Appointment>;
}

function dateOperator(value: unknown): { type: string; value: Date } | undefined {
  if (!(value instanceof FindOperator)) {
    return undefined;
  }
  return { type: value.type, value: value.value as Date };
}

function matchesDayIntersection(appointment: AppointmentTimes, where: FindOptionsWhere<Appointment>): boolean {
  const startFilter = dateOperator(where.start);
  const endAtFilter = dateOperator(where.endAt);
  if (startFilter === undefined || endAtFilter === undefined) {
    return false;
  }
  return (
    startFilter.type === 'lessThan' &&
    appointment.start < startFilter.value &&
    endAtFilter.type === 'moreThan' &&
    appointment.endAt > endAtFilter.value
  );
}

describe('findAppointments date filter', () => {
  beforeEach(() => {
    repositoryMock.find.mockReset();
  });

  it('returns a cross-midnight appointment when the local day starts after it begins', async () => {
    const crossing: AppointmentTimes = {
      id: '44444444-4444-4444-8444-444444444444',
      start: new Date('2026-11-21T02:30:00.000Z'),
      endAt: new Date('2026-11-21T03:30:00.000Z'),
    };
    const dayStart = new Date('2026-11-21T03:00:00.000Z');
    const dayEnd = new Date('2026-11-22T03:00:00.000Z');
    let capturedWhere: FindOptionsWhere<Appointment> | undefined;

    repositoryMock.find.mockImplementation((options: RepositoryFindOptions) => {
      capturedWhere = options.where;
      const matches = matchesDayIntersection(crossing, options.where);
      return Promise.resolve(matches ? [crossing as unknown as Appointment] : []);
    });

    const result = await findAppointments({ professionalId: undefined, startFrom: dayStart, startTo: dayEnd });

    expect(result).toHaveLength(1);
    const startFilter = dateOperator(capturedWhere?.start);
    const endAtFilter = dateOperator(capturedWhere?.endAt);
    expect(startFilter?.type).toBe('lessThan');
    expect(startFilter?.value).toEqual(dayEnd);
    expect(endAtFilter?.type).toBe('moreThan');
    expect(endAtFilter?.value).toEqual(dayStart);
  });
});
