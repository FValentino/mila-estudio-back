import bcrypt from 'bcrypt';
import { DateTime } from 'luxon';
import { describe, expect, it, vi } from 'vitest';
import type { Area } from '../../features/areas/entities/area.entity.js';
import type { Appointment } from '../../features/appointments/entities/appointment.entity.js';
import { AppointmentStatus } from '../../features/appointments/types/appointment.types.js';
import type { Professional } from '../../features/professionals/entities/professional.entity.js';
import type { ServiceOffering } from '../../features/services/entities/service.entity.js';
import type { User } from '../../features/users/entities/user.entity.js';
import { SALT_ROUNDS } from './seed-admin.logic.js';
import { seedDemo } from './seed-demo.logic.js';
import type { SeedDemoDeps } from './seed-demo.logic.js';

const NOW = new Date('2026-11-22T12:00:00.000Z');
const TIMEZONE = 'America/Argentina/Buenos_Aires';
const MINUTE_IN_MS = 60_000;

interface Harness {
  deps: SeedDemoDeps;
  users: User[];
  areas: Area[];
  professionals: Professional[];
  services: ServiceOffering[];
  appointments: Appointment[];
}

function createHarness(): Harness {
  const users: User[] = [];
  const areas: Area[] = [];
  const professionals: Professional[] = [];
  const services: ServiceOffering[] = [];
  const appointments: Appointment[] = [];

  const findUserByEmail = vi.fn(async (email: string): Promise<User | null> =>
    users.find((candidate) => candidate.email.toLowerCase() === email.toLowerCase()) ?? null,
  );
  const saveUser = vi.fn(async (user: User): Promise<User> => {
    if (!user.id) {
      user.id = `user-${users.length + 1}`;
    }
    const index = users.findIndex((candidate) => candidate.id === user.id);
    if (index >= 0) {
      users[index] = user;
    } else {
      users.push(user);
    }
    return user;
  });

  const findAreaByName = vi.fn(async (name: string): Promise<Area | null> =>
    areas.find((candidate) => candidate.name === name) ?? null,
  );
  const saveArea = vi.fn(async (area: Area): Promise<Area> => {
    if (!area.id) {
      area.id = `area-${areas.length + 1}`;
    }
    const index = areas.findIndex((candidate) => candidate.id === area.id);
    if (index >= 0) {
      areas[index] = area;
    } else {
      areas.push(area);
    }
    return area;
  });

  const findProfessionalByName = vi.fn(
    async (firstName: string, lastName: string): Promise<Professional | null> =>
      professionals.find(
        (candidate) => candidate.firstName === firstName && candidate.lastName === lastName,
      ) ?? null,
  );
  const saveProfessional = vi.fn(async (professional: Professional): Promise<Professional> => {
    if (!professional.id) {
      professional.id = `professional-${professionals.length + 1}`;
    }
    const index = professionals.findIndex((candidate) => candidate.id === professional.id);
    if (index >= 0) {
      professionals[index] = professional;
    } else {
      professionals.push(professional);
    }
    return professional;
  });

  const findServiceByName = vi.fn(async (name: string): Promise<ServiceOffering | null> =>
    services.find((candidate) => candidate.name === name) ?? null,
  );
  const saveService = vi.fn(async (service: ServiceOffering): Promise<ServiceOffering> => {
    if (!service.id) {
      service.id = `service-${services.length + 1}`;
    }
    const index = services.findIndex((candidate) => candidate.id === service.id);
    if (index >= 0) {
      services[index] = service;
    } else {
      services.push(service);
    }
    return service;
  });

  const findAppointmentByClientEmail = vi.fn(
    async (clientEmail: string): Promise<Appointment | null> =>
      appointments.find((candidate) => candidate.clientEmail === clientEmail) ?? null,
  );
  const saveAppointment = vi.fn(async (appointment: Appointment): Promise<Appointment> => {
    if (!appointment.id) {
      appointment.id = `appointment-${appointments.length + 1}`;
    }
    const index = appointments.findIndex((candidate) => candidate.id === appointment.id);
    if (index >= 0) {
      appointments[index] = appointment;
    } else {
      appointments.push(appointment);
    }
    return appointment;
  });

  return {
    deps: {
      now: NOW,
      timezone: TIMEZONE,
      findUserByEmail,
      saveUser,
      findAreaByName,
      saveArea,
      findProfessionalByName,
      saveProfessional,
      findServiceByName,
      saveService,
      findAppointmentByClientEmail,
      saveAppointment,
      hashPassword: (password) => bcrypt.hash(password, SALT_ROUNDS),
    },
    users,
    areas,
    professionals,
    services,
    appointments,
  };
}

function idsOf(items: readonly { id: string }[]): string[] {
  return items.map((item) => item.id);
}

describe('seedDemo', () => {
  it('creates the demo dataset with roles, hashes, relations, relative dates and no overlap', async () => {
    const harness = createHarness();

    const result = await seedDemo(harness.deps);

    expect(result.users.map((user) => user.email)).toEqual(['admin@mila.test', 'user@mila.test']);
    expect(result.users.map((user) => user.role)).toEqual(['admin', 'user']);
    expect(await bcrypt.compare('AdminDemo123!', result.users[0]?.passwordHash ?? '')).toBe(true);
    expect(await bcrypt.compare('UserDemo123!', result.users[1]?.passwordHash ?? '')).toBe(true);

    expect(result.areas.map((area) => area.name)).toEqual(['Demo Manicuría', 'Demo Masajes']);
    expect(result.professionals[0]?.area).toBe(result.areas[0]);
    expect(result.professionals[1]?.area).toBe(result.areas[1]);
    expect(result.services[0]?.area).toBe(result.areas[0]);
    expect(result.services[0]?.price).toBe('1500.00');
    expect(result.services[1]?.area).toBe(result.areas[1]);
    expect(result.services[1]?.price).toBe('2500.00');

    expect(result.appointments).toHaveLength(4);
    expect(new Set(result.appointments.map((appointment) => appointment.status))).toEqual(
      new Set([AppointmentStatus.CONFIRMED, AppointmentStatus.CANCELLED]),
    );

    for (const appointment of result.appointments) {
      expect(appointment.start.getTime()).toBeGreaterThan(NOW.getTime());
      expect(appointment.endAt.getTime()).toBe(
        appointment.start.getTime() + appointment.service.durationMinutes * MINUTE_IN_MS,
      );
      expect(appointment.professional.area).toBe(appointment.service.area);
    }

    const expectedFirstStart = DateTime.fromJSDate(NOW, { zone: TIMEZONE })
      .plus({ days: 1 })
      .set({ hour: 10, minute: 0, second: 0, millisecond: 0 })
      .toUTC()
      .toJSDate();
    expect(result.appointments[0]?.start).toEqual(expectedFirstStart);

    const byProfessional = new Map<string, Appointment[]>();
    for (const appointment of result.appointments) {
      const key = appointment.professional.id;
      const group = byProfessional.get(key) ?? [];
      group.push(appointment);
      byProfessional.set(key, group);
    }
    for (const group of byProfessional.values()) {
      const sorted = [...group].sort((left, right) => left.start.getTime() - right.start.getTime());
      for (let index = 1; index < sorted.length; index += 1) {
        const previous = sorted[index - 1];
        const current = sorted[index];
        if (previous !== undefined && current !== undefined) {
          expect(previous.endAt.getTime()).toBeLessThanOrEqual(current.start.getTime());
        }
      }
    }
  });

  it('is idempotent: a second run updates natural keys without creating duplicates', async () => {
    const harness = createHarness();

    const first = await seedDemo(harness.deps);
    const second = await seedDemo(harness.deps);

    expect(harness.users).toHaveLength(2);
    expect(harness.areas).toHaveLength(2);
    expect(harness.professionals).toHaveLength(2);
    expect(harness.services).toHaveLength(2);
    expect(harness.appointments).toHaveLength(4);

    expect(idsOf(second.users)).toEqual(idsOf(first.users));
    expect(idsOf(second.areas)).toEqual(idsOf(first.areas));
    expect(idsOf(second.professionals)).toEqual(idsOf(first.professionals));
    expect(idsOf(second.services)).toEqual(idsOf(first.services));
    expect(idsOf(second.appointments)).toEqual(idsOf(first.appointments));
    expect(second.appointments.map((appointment) => appointment.start.toISOString())).toEqual(
      first.appointments.map((appointment) => appointment.start.toISOString()),
    );
  });
});
