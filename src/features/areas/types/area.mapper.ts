import type { Area } from '../entities/area.entity.js';
import type { AreaDto } from './area.types.js';

export function mapAreaToDto(area: Area): AreaDto {
  return {
    id: area.id,
    name: area.name,
    description: area.description,
    createdAt: area.createdAt.toISOString(),
    updatedAt: area.updatedAt.toISOString(),
  };
}
