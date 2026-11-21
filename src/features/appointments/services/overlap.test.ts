import { describe, expect, it } from 'vitest';
import { ConflictError } from '../../../shared/errors/domain-errors.js';
import {
  assertNoOverlap,
  findOverlappingAppointment,
  intervalIntersectsDay,
  intervalsOverlap,
} from './overlap.js';

const requested = {
  start: new Date('2026-11-20T10:00:00.000Z'),
  end: new Date('2026-11-20T11:00:00.000Z'),
};

describe('intervalsOverlap', () => {
  it('returns false when one interval ends exactly when the other starts', () => {
    const next = { start: requested.end, end: new Date('2026-11-20T12:00:00.000Z') };
    expect(intervalsOverlap(requested, next)).toBe(false);
    expect(intervalsOverlap(next, requested)).toBe(false);
  });

  it('returns true for partial overlaps', () => {
    const candidate = {
      start: new Date('2026-11-20T10:30:00.000Z'),
      end: new Date('2026-11-20T11:30:00.000Z'),
    };
    expect(intervalsOverlap(requested, candidate)).toBe(true);
  });

  it('returns true when one interval contains the other', () => {
    const candidate = {
      start: new Date('2026-11-20T09:00:00.000Z'),
      end: new Date('2026-11-20T12:00:00.000Z'),
    };
    expect(intervalsOverlap(candidate, requested)).toBe(true);
  });

  it('returns false for disjoint intervals', () => {
    const candidate = {
      start: new Date('2026-11-20T11:01:00.000Z'),
      end: new Date('2026-11-20T12:00:00.000Z'),
    };
    expect(intervalsOverlap(requested, candidate)).toBe(false);
  });
});

describe('intervalIntersectsDay', () => {
  const dayStart = new Date('2026-11-20T03:00:00.000Z');
  const nextDayStart = new Date('2026-11-21T03:00:00.000Z');
  const dayAfterStart = new Date('2026-11-22T03:00:00.000Z');

  it('includes an appointment that crosses local midnight in both days', () => {
    const crossing = {
      start: new Date('2026-11-21T02:30:00.000Z'),
      end: new Date('2026-11-21T03:30:00.000Z'),
    };
    expect(intervalIntersectsDay(crossing, dayStart, nextDayStart)).toBe(true);
    expect(intervalIntersectsDay(crossing, nextDayStart, dayAfterStart)).toBe(true);
  });

  it('excludes an appointment ending exactly at the next local midnight', () => {
    const endingAtMidnight = {
      start: new Date('2026-11-20T22:00:00.000Z'),
      end: nextDayStart,
    };
    expect(intervalIntersectsDay(endingAtMidnight, nextDayStart, dayAfterStart)).toBe(false);
  });
});

describe('findOverlappingAppointment', () => {
  it('returns the first overlapping candidate', () => {
    const disjoint = {
      id: 'disjoint',
      start: new Date('2026-11-20T12:00:00.000Z'),
      end: new Date('2026-11-20T13:00:00.000Z'),
    };
    const overlapping = {
      id: 'overlapping',
      start: new Date('2026-11-20T10:45:00.000Z'),
      end: new Date('2026-11-20T11:30:00.000Z'),
    };
    expect(findOverlappingAppointment([disjoint, overlapping], requested)?.id).toBe('overlapping');
  });
});

describe('assertNoOverlap', () => {
  it('throws a ConflictError when a candidate overlaps', () => {
    const overlapping = {
      start: new Date('2026-11-20T10:45:00.000Z'),
      end: new Date('2026-11-20T11:30:00.000Z'),
    };
    expect(() => assertNoOverlap([overlapping], requested)).toThrowError(ConflictError);
  });

  it('does not throw when every candidate is disjoint', () => {
    const disjoint = {
      start: new Date('2026-11-20T11:00:00.000Z'),
      end: new Date('2026-11-20T12:00:00.000Z'),
    };
    expect(() => assertNoOverlap([disjoint], requested)).not.toThrow();
  });
});
