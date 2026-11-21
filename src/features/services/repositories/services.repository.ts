import type { Repository } from 'typeorm';
import { dataSource } from '../../../shared/database/data-source.js';
import { ServiceOffering } from '../entities/service.entity.js';

function serviceRepository(): Repository<ServiceOffering> {
  return dataSource.getRepository(ServiceOffering);
}

export async function findAllServices(): Promise<ServiceOffering[]> {
  return serviceRepository().find({ order: { name: 'ASC' } });
}

export async function findServiceById(id: string): Promise<ServiceOffering | null> {
  return serviceRepository().findOne({ where: { id } });
}

export async function saveService(service: ServiceOffering): Promise<ServiceOffering> {
  return serviceRepository().save(service);
}

export async function deleteService(id: string): Promise<boolean> {
  const result = await serviceRepository().delete({ id });
  return (result.affected ?? 0) > 0;
}
