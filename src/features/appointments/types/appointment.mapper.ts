import type { Appointment } from '../entities/appointment.entity.js';
import type { AppointmentDto } from './appointment.types.js';

export function mapAppointmentToDto(appointment: Appointment): AppointmentDto {
  return {
    id: appointment.id,
    professionalId: appointment.professionalId,
    serviceId: appointment.serviceId,
    start: appointment.start.toISOString(),
    endAt: appointment.endAt.toISOString(),
    clientName: appointment.clientName,
    clientPhone: appointment.clientPhone,
    clientEmail: appointment.clientEmail,
    notes: appointment.notes,
    status: appointment.status,
    createdAt: appointment.createdAt.toISOString(),
    updatedAt: appointment.updatedAt.toISOString(),
  };
}
