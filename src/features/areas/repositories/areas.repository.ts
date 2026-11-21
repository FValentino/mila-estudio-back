import type { Repository } from 'typeorm';
import { dataSource } from '../../../shared/database/data-source.js';
import { Area } from '../entities/area.entity.js';

function areaRepository(): Repository<Area> {
  return dataSource.getRepository(Area);
}

export async function findAllAreas(): Promise<Area[]> {
  return areaRepository().find({ order: { name: 'ASC' } });
}

export async function findAreaById(id: string): Promise<Area | null> {
  return areaRepository().findOne({ where: { id } });
}

export async function saveArea(area: Area): Promise<Area> {
  return areaRepository().save(area);
}

export async function deleteArea(id: string): Promise<boolean> {
  const result = await areaRepository().delete({ id });
  return (result.affected ?? 0) > 0;
}
