import { describe, expect, it } from 'vitest';
import { Appointment } from '../entities/appointment.entity.js';
import { AppointmentStatus } from './appointment.types.js';
import { mapAppointmentToDto } from './appointment.mapper.js';

describe('mapAppointmentToDto', () => {
  it('maps an Appointment entity to a plain DTO without exposing relations', () => {
    const appointment = new Appointment();
    appointment.id = 'c2f1b0a3-1a3f-4b5e-8b2d-9b2c3d4e5f60';
    appointment.professionalId = 'd3a2c1b4-2b40-4c6f-9c3e-ac3d4e5f6071';
    appointment.serviceId = 'e4b3d2c5-3c51-4d70-ad4f-bd4e5f607182';
    appointment.start = new Date('2026-11-20T10:00:00.000Z');
    appointment.endAt = new Date('2026-11-20T11:00:00.000Z');
    appointment.clientName = 'Ana Pérez';
    appointment.clientPhone = '+54 9 11 5555 5555';
    appointment.clientEmail = null;
    appointment.notes = null;
    appointment.status = AppointmentStatus.CONFIRMED;
    appointment.createdAt = new Date('2026-11-19T09:00:00.000Z');
    appointment.updatedAt = new Date('2026-11-19T09:00:00.000Z');

    const dto = mapAppointmentToDto(appointment);

    expect(dto).toEqual({
      id: appointment.id,
      professionalId: appointment.professionalId,
      serviceId: appointment.serviceId,
      start: '2026-11-20T10:00:00.000Z',
      endAt: '2026-11-20T11:00:00.000Z',
      clientName: 'Ana Pérez',
      clientPhone: '+54 9 11 5555 5555',
      clientEmail: null,
      notes: null,
      status: 'confirmed',
      createdAt: '2026-11-19T09:00:00.000Z',
      updatedAt: '2026-11-19T09:00:00.000Z',
    });
    expect(dto).not.toHaveProperty('professional');
    expect(dto).not.toHaveProperty('service');
  });
});
