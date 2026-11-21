import { DateTime } from 'luxon';
import { z } from 'zod';

export enum AppointmentStatus {
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
}

export interface AppointmentDto {
  id: string;
  professionalId: string;
  serviceId: string;
  start: string;
  endAt: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string | null;
  notes: string | null;
  status: AppointmentStatus;
  createdAt: string;
  updatedAt: string;
}

export const createAppointmentSchema = z.object({
  professionalId: z.uuid(),
  serviceId: z.uuid(),
  start: z.iso.datetime({ offset: true }),
  clientName: z.string().trim().min(1).max(150),
  clientPhone: z.string().trim().min(1).max(50),
  clientEmail: z.email().max(150).nullish(),
  notes: z.string().trim().max(1000).nullish(),
});

export const updateAppointmentStatusSchema = z.object({
  status: z.enum([AppointmentStatus.CONFIRMED, AppointmentStatus.CANCELLED]),
});

export const replaceAppointmentSchema = createAppointmentSchema.extend({
  status: z.enum([AppointmentStatus.CONFIRMED, AppointmentStatus.CANCELLED]),
});

const calendarDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected format YYYY-MM-DD')
  .refine((value) => {
    const parsed = DateTime.fromISO(value, { zone: 'UTC' });
    return parsed.isValid && parsed.toISODate() === value;
  }, 'Invalid calendar date');

export const listAppointmentsQuerySchema = z.object({
  professionalId: z.uuid().optional(),
  date: calendarDateSchema.optional(),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type ReplaceAppointmentInput = z.infer<typeof replaceAppointmentSchema>;
export type UpdateAppointmentStatusInput = z.infer<typeof updateAppointmentStatusSchema>;
export type ListAppointmentsQuery = z.infer<typeof listAppointmentsQuerySchema>;
