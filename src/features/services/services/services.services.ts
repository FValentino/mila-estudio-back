import { NotFoundError } from '../../../shared/errors/domain-errors.js';
import { getArea } from '../../areas/services/areas.services.js';
import { Area } from '../../areas/entities/area.entity.js';
import { ServiceOffering } from '../entities/service.entity.js';
import {
  deleteService,
  findAllServices,
  findServiceById,
  saveService,
} from '../repositories/services.repository.js';
import { mapServiceToDto } from '../types/service.mapper.js';
import type { CreateServiceInput, ServiceDto, UpdateServiceInput } from '../types/service.types.js';

function areaReference(areaId: string): Area {
  const area = new Area();
  area.id = areaId;
  return area;
}

export async function listServices(): Promise<ServiceDto[]> {
  const services = await findAllServices();
  return services.map(mapServiceToDto);
}

export async function getService(id: string): Promise<ServiceDto> {
  const service = await findServiceById(id);
  if (service === null) {
    throw new NotFoundError(`Service with id ${id} was not found`);
  }
  return mapServiceToDto(service);
}

export async function createService(input: CreateServiceInput): Promise<ServiceDto> {
  await getArea(input.areaId);

  const service = new ServiceOffering();
  service.name = input.name;
  service.durationMinutes = input.durationMinutes;
  service.area = areaReference(input.areaId);
  service.areaId = input.areaId;
  return mapServiceToDto(await saveService(service));
}

export async function updateService(id: string, input: UpdateServiceInput): Promise<ServiceDto> {
  const service = await findServiceById(id);
  if (service === null) {
    throw new NotFoundError(`Service with id ${id} was not found`);
  }
  if (input.name !== undefined) {
    service.name = input.name;
  }
  if (input.durationMinutes !== undefined) {
    service.durationMinutes = input.durationMinutes;
  }
  if (input.areaId !== undefined) {
    await getArea(input.areaId);
    service.area = areaReference(input.areaId);
    service.areaId = input.areaId;
  }
  return mapServiceToDto(await saveService(service));
}

export async function removeService(id: string): Promise<void> {
  const deleted = await deleteService(id);
  if (!deleted) {
    throw new NotFoundError(`Service with id ${id} was not found`);
  }
}
