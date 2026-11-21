import { ConflictError } from '../../../shared/errors/domain-errors.js';

export interface AppointmentInterval {
  start: Date;
  end: Date;
}

export function intervalsOverlap(first: AppointmentInterval, second: AppointmentInterval): boolean {
  return first.start < second.end && second.start < first.end;
}

export function intervalIntersectsDay(
  interval: AppointmentInterval,
  dayStart: Date,
  dayEnd: Date,
): boolean {
  return interval.start < dayEnd && interval.end > dayStart;
}

export function findOverlappingAppointment<T extends AppointmentInterval>(
  candidates: readonly T[],
  requested: AppointmentInterval,
): T | undefined {
  return candidates.find((candidate) => intervalsOverlap(candidate, requested));
}

export function assertNoOverlap(
  candidates: readonly AppointmentInterval[],
  requested: AppointmentInterval,
): void {
  const conflicting = findOverlappingAppointment(candidates, requested);
  if (conflicting !== undefined) {
    throw new ConflictError('The professional already has an appointment overlapping that time range');
  }
}
