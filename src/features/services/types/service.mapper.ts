import type { ServiceOffering } from '../entities/service.entity.js';
import type { ServiceDto } from './service.types.js';

export function mapServiceToDto(service: ServiceOffering): ServiceDto {
  return {
    id: service.id,
    name: service.name,
    durationMinutes: service.durationMinutes,
    areaId: service.areaId,
    createdAt: service.createdAt.toISOString(),
    updatedAt: service.updatedAt.toISOString(),
  };
}
