import { NotFoundError } from '../../../shared/errors/domain-errors.js';
import { Area } from '../entities/area.entity.js';
import { deleteArea, findAllAreas, findAreaById, saveArea } from '../repositories/areas.repository.js';
import { mapAreaToDto } from '../types/area.mapper.js';
import type { AreaDto, CreateAreaInput, ReplaceAreaInput, UpdateAreaInput } from '../types/area.types.js';

export async function listAreas(): Promise<AreaDto[]> {
  const areas = await findAllAreas();
  return areas.map(mapAreaToDto);
}

export async function getArea(id: string): Promise<AreaDto> {
  const area = await findAreaById(id);
  if (area === null) {
    throw new NotFoundError(`Area with id ${id} was not found`);
  }
  return mapAreaToDto(area);
}

export async function createArea(input: CreateAreaInput): Promise<AreaDto> {
  const area = new Area();
  area.name = input.name;
  area.description = input.description ?? null;
  return mapAreaToDto(await saveArea(area));
}

export async function updateArea(id: string, input: UpdateAreaInput): Promise<AreaDto> {
  const area = await findAreaById(id);
  if (area === null) {
    throw new NotFoundError(`Area with id ${id} was not found`);
  }
  if (input.name !== undefined) {
    area.name = input.name;
  }
  if (input.description !== undefined) {
    area.description = input.description;
  }
  return mapAreaToDto(await saveArea(area));
}

export async function replaceArea(id: string, input: ReplaceAreaInput): Promise<AreaDto> {
  const area = await findAreaById(id);
  if (area === null) {
    throw new NotFoundError(`Area with id ${id} was not found`);
  }
  area.name = input.name;
  area.description = input.description ?? null;
  return mapAreaToDto(await saveArea(area));
}

export async function removeArea(id: string): Promise<void> {
  const deleted = await deleteArea(id);
  if (!deleted) {
    throw new NotFoundError(`Area with id ${id} was not found`);
  }
}
