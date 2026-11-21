import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Area } from '../../areas/entities/area.entity.js';
import { getArea } from '../../areas/services/areas.services.js';
import type { AreaDto } from '../../areas/types/area.types.js';
import { ServiceOffering } from '../entities/service.entity.js';
import { findServiceById, saveService } from '../repositories/services.repository.js';
import { createService, replaceService, updateService } from './services.services.js';

vi.mock('../../areas/services/areas.services.js', () => ({ getArea: vi.fn() }));
vi.mock('../repositories/services.repository.js', () => ({
  deleteService: vi.fn(),
  findAllServices: vi.fn(),
  findServiceById: vi.fn(),
  saveService: vi.fn(),
}));

const SERVICE_ID = '33333333-3333-4333-8333-333333333333';
const AREA_ID = '11111111-1111-4111-8111-111111111111';
const CREATED_AT = new Date('2026-11-19T09:00:00.000Z');
const UPDATED_AT = new Date('2026-11-19T10:00:00.000Z');

function makeAreaDto(): AreaDto {
  return {
    id: AREA_ID,
    name: 'Manicuría',
    description: null,
    createdAt: CREATED_AT.toISOString(),
    updatedAt: UPDATED_AT.toISOString(),
  };
}

function makeArea(): Area {
  const area = new Area();
  area.id = AREA_ID;
  area.name = 'Manicuría';
  area.description = null;
  area.createdAt = CREATED_AT;
  area.updatedAt = UPDATED_AT;
  return area;
}

function makeService(price = '1000.00'): ServiceOffering {
  const service = new ServiceOffering();
  service.id = SERVICE_ID;
  service.name = 'Manicuría básica';
  service.durationMinutes = 45;
  service.price = price;
  service.area = makeArea();
  service.areaId = AREA_ID;
  service.createdAt = CREATED_AT;
  service.updatedAt = UPDATED_AT;
  return service;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getArea).mockResolvedValue(makeAreaDto());
  vi.mocked(findServiceById).mockResolvedValue(makeService());
  vi.mocked(saveService).mockImplementation(async (service) => {
    if (!service.id) {
      service.id = SERVICE_ID;
    }
    service.createdAt = CREATED_AT;
    service.updatedAt = UPDATED_AT;
    return service;
  });
});

describe('service price persistence', () => {
  it('creates a service with a two-decimal price string and returns a number', async () => {
    const dto = await createService({
      name: 'Manicuría básica',
      durationMinutes: 45,
      price: 1500.12,
      areaId: AREA_ID,
    });

    expect(vi.mocked(saveService).mock.calls[0]?.[0].price).toBe('1500.12');
    expect(dto.price).toBe(1500.12);
  });

  it('updates an existing service price', async () => {
    const dto = await updateService(SERVICE_ID, { price: 1800.5 });

    expect(vi.mocked(saveService).mock.calls[0]?.[0].price).toBe('1800.50');
    expect(dto.price).toBe(1800.5);
  });

  it('replaces an existing service with the maximum allowed price', async () => {
    const dto = await replaceService(SERVICE_ID, {
      name: 'Manicuría básica',
      durationMinutes: 45,
      price: 99_999_999.99,
      areaId: AREA_ID,
    });

    expect(vi.mocked(saveService).mock.calls[0]?.[0].price).toBe('99999999.99');
    expect(dto.price).toBe(99_999_999.99);
  });
});
