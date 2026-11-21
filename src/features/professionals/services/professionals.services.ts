import { getArea } from '../../areas/services/areas.services.js';
import { NotFoundError } from '../../../shared/errors/domain-errors.js';
import { Area } from '../../areas/entities/area.entity.js';
import { Professional } from '../entities/professional.entity.js';
import {
  deleteProfessional,
  findAllProfessionals,
  findProfessionalById,
  saveProfessional,
} from '../repositories/professionals.repository.js';
import { mapProfessionalToDto } from '../types/professional.mapper.js';
import type {
  CreateProfessionalInput,
  ProfessionalDto,
  ReplaceProfessionalInput,
  UpdateProfessionalInput,
} from '../types/professional.types.js';

function areaReference(areaId: string): Area {
  const area = new Area();
  area.id = areaId;
  return area;
}

export async function listProfessionals(): Promise<ProfessionalDto[]> {
  const professionals = await findAllProfessionals();
  return professionals.map(mapProfessionalToDto);
}

export async function getProfessional(id: string): Promise<ProfessionalDto> {
  const professional = await findProfessionalById(id);
  if (professional === null) {
    throw new NotFoundError(`Professional with id ${id} was not found`);
  }
  return mapProfessionalToDto(professional);
}

export async function createProfessional(input: CreateProfessionalInput): Promise<ProfessionalDto> {
  await getArea(input.areaId);

  const professional = new Professional();
  professional.firstName = input.firstName;
  professional.lastName = input.lastName;
  professional.area = areaReference(input.areaId);
  professional.areaId = input.areaId;
  return mapProfessionalToDto(await saveProfessional(professional));
}

export async function updateProfessional(id: string, input: UpdateProfessionalInput): Promise<ProfessionalDto> {
  const professional = await findProfessionalById(id);
  if (professional === null) {
    throw new NotFoundError(`Professional with id ${id} was not found`);
  }
  if (input.firstName !== undefined) {
    professional.firstName = input.firstName;
  }
  if (input.lastName !== undefined) {
    professional.lastName = input.lastName;
  }
  if (input.areaId !== undefined) {
    await getArea(input.areaId);
    professional.area = areaReference(input.areaId);
    professional.areaId = input.areaId;
  }
  return mapProfessionalToDto(await saveProfessional(professional));
}

export async function replaceProfessional(
  id: string,
  input: ReplaceProfessionalInput,
): Promise<ProfessionalDto> {
  const professional = await findProfessionalById(id);
  if (professional === null) {
    throw new NotFoundError(`Professional with id ${id} was not found`);
  }
  await getArea(input.areaId);
  professional.firstName = input.firstName;
  professional.lastName = input.lastName;
  professional.area = areaReference(input.areaId);
  professional.areaId = input.areaId;
  return mapProfessionalToDto(await saveProfessional(professional));
}

export async function removeProfessional(id: string): Promise<void> {
  const deleted = await deleteProfessional(id);
  if (!deleted) {
    throw new NotFoundError(`Professional with id ${id} was not found`);
  }
}
