import type { Repository } from 'typeorm';
import { dataSource } from '../../../shared/database/data-source.js';
import { Professional } from '../entities/professional.entity.js';

function professionalRepository(): Repository<Professional> {
  return dataSource.getRepository(Professional);
}

export async function findAllProfessionals(): Promise<Professional[]> {
  return professionalRepository().find({ order: { lastName: 'ASC', firstName: 'ASC' } });
}

export async function findProfessionalById(id: string): Promise<Professional | null> {
  return professionalRepository().findOne({ where: { id } });
}

export async function saveProfessional(professional: Professional): Promise<Professional> {
  return professionalRepository().save(professional);
}

export async function deleteProfessional(id: string): Promise<boolean> {
  const result = await professionalRepository().delete({ id });
  return (result.affected ?? 0) > 0;
}
