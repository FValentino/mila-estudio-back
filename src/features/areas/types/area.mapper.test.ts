import { describe, expect, it } from 'vitest';
import { Area } from '../entities/area.entity.js';
import { mapAreaToDto } from './area.mapper.js';

describe('mapAreaToDto', () => {
  it('maps an Area entity to a plain DTO with ISO dates', () => {
    const area = new Area();
    area.id = 'b1e0a0f2-0f2f-4a3d-9a1c-8a1b2c3d4e5f';
    area.name = 'Manicuría';
    area.description = 'Cuidado y embellecimiento de uñas';
    area.createdAt = new Date('2026-11-20T10:00:00.000Z');
    area.updatedAt = new Date('2026-11-20T11:00:00.000Z');

    expect(mapAreaToDto(area)).toEqual({
      id: area.id,
      name: 'Manicuría',
      description: 'Cuidado y embellecimiento de uñas',
      createdAt: '2026-11-20T10:00:00.000Z',
      updatedAt: '2026-11-20T11:00:00.000Z',
    });
  });

  it('preserves a null description', () => {
    const area = new Area();
    area.id = 'b1e0a0f2-0f2f-4a3d-9a1c-8a1b2c3d4e5f';
    area.name = 'Masajes';
    area.description = null;
    area.createdAt = new Date('2026-11-20T10:00:00.000Z');
    area.updatedAt = new Date('2026-11-20T10:00:00.000Z');

    expect(mapAreaToDto(area).description).toBeNull();
  });
});
