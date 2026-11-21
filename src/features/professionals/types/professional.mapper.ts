import type { Professional } from '../entities/professional.entity.js';
import type { ProfessionalDto } from './professional.types.js';

export function mapProfessionalToDto(professional: Professional): ProfessionalDto {
  return {
    id: professional.id,
    firstName: professional.firstName,
    lastName: professional.lastName,
    areaId: professional.areaId,
    createdAt: professional.createdAt.toISOString(),
    updatedAt: professional.updatedAt.toISOString(),
  };
}
