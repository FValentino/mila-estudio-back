import { describe, expect, it } from 'vitest';
import { ServiceOffering } from '../entities/service.entity.js';
import { mapServiceToDto } from './service.mapper.js';

describe('mapServiceToDto', () => {
  it('converts the database decimal price into a number', () => {
    const service = new ServiceOffering();
    service.id = '33333333-3333-4333-8333-333333333333';
    service.name = 'Manicuría básica';
    service.durationMinutes = 45;
    service.price = '1500.00';
    service.areaId = '11111111-1111-4111-8111-111111111111';
    service.createdAt = new Date('2026-11-19T09:00:00.000Z');
    service.updatedAt = new Date('2026-11-19T10:00:00.000Z');

    const dto = mapServiceToDto(service);

    expect(dto).toEqual({
      id: service.id,
      name: service.name,
      durationMinutes: 45,
      price: 1500,
      areaId: service.areaId,
      createdAt: '2026-11-19T09:00:00.000Z',
      updatedAt: '2026-11-19T10:00:00.000Z',
    });
    expect(Object.keys(dto)).toContain('price');
  });
});
