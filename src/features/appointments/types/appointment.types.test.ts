import { describe, expect, it } from 'vitest';
import { createAppointmentSchema, listAppointmentsQuerySchema } from './appointment.types.js';

const VALID_UUID = '11111111-1111-4111-8111-111111111111';

function inputWithEmail(localLength: number): Record<string, unknown> {
  return {
    professionalId: VALID_UUID,
    serviceId: VALID_UUID,
    start: '2026-11-20T10:00:00.000Z',
    clientName: 'Ana Pérez',
    clientPhone: '+54 9 11 5555 5555',
    clientEmail: `${'a'.repeat(localLength)}@example.com`,
  };
}

describe('createAppointmentSchema.clientEmail', () => {
  it('accepts an email of exactly 150 characters', () => {
    expect(createAppointmentSchema.safeParse(inputWithEmail(138)).success).toBe(true);
  });

  it('rejects an email of 151 characters', () => {
    expect(createAppointmentSchema.safeParse(inputWithEmail(139)).success).toBe(false);
  });
});

describe('listAppointmentsQuerySchema.date', () => {
  it('accepts a real calendar date', () => {
    expect(listAppointmentsQuerySchema.safeParse({ date: '2026-11-20' }).success).toBe(true);
  });

  it.each(['2026-02-30', '2026-2-20', '20-11-2026', '2026/11/20'])('rejects %s', (date) => {
    expect(listAppointmentsQuerySchema.safeParse({ date }).success).toBe(false);
  });

  it('allows the date to be omitted', () => {
    expect(listAppointmentsQuerySchema.safeParse({}).success).toBe(true);
  });
});
