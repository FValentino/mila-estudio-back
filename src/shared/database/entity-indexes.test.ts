import { getMetadataArgsStorage } from 'typeorm';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { Appointment } from '../../features/appointments/entities/appointment.entity.js';
import { Professional } from '../../features/professionals/entities/professional.entity.js';
import { ServiceOffering } from '../../features/services/entities/service.entity.js';
import { dataSource } from './data-source.js';

vi.mock('../config/env.js', () => ({
  env: {
    PORT: 3000,
    JWT_SECRET: 'test-jwt-secret',
    DATABASE_URL: 'postgresql://user:password@localhost:5432/db',
    TIMEZONE: 'America/Argentina/Buenos_Aires',
  },
}));

type IndexArgs = ReturnType<typeof getMetadataArgsStorage>['indices'][number];

interface IndexShape {
  name: string;
  columns: string[];
  unique: boolean;
}

interface ResolvedIndexShape {
  name: string;
  columns: string[];
}

function indicesFor(target: Function): IndexShape[] {
  return getMetadataArgsStorage()
    .filterIndices(target)
    .map((index: IndexArgs) => ({
      name: index.name ?? '',
      columns: Array.isArray(index.columns) ? index.columns : [],
      unique: index.unique === true,
    }))
    .sort((left, right) => left.name.localeCompare(right.name));
}

function databaseColumnsFor(target: Function): string[] {
  const storage = getMetadataArgsStorage();
  return [
    ...storage.columns
      .filter((column) => column.target === target)
      .map((column) => column.options.name ?? column.propertyName),
    ...storage.joinColumns
      .filter((joinColumn) => joinColumn.target === target)
      .map((joinColumn) => joinColumn.name ?? joinColumn.propertyName),
  ];
}

function resolvedIndicesFor(tableName: string): ResolvedIndexShape[] {
  const metadata = dataSource.entityMetadatas.find(
    (candidate) => candidate.tableName === tableName,
  );
  if (metadata === undefined) {
    throw new Error(`Missing resolved metadata for ${tableName}`);
  }
  return metadata.indices
    .map((index) => ({
      name: index.name ?? '',
      columns: index.columns.map((column) => column.databaseName),
    }))
    .sort((left, right) => left.name.localeCompare(right.name));
}

beforeAll(async () => {
  const metadataBuilder = dataSource as unknown as { buildMetadatas(): Promise<void> };
  await metadataBuilder.buildMetadatas();
});

describe('entity index metadata', () => {
  it('declares all appointment indexes with their original names and columns', () => {
    expect(indicesFor(Appointment)).toEqual([
      { name: 'IDX_appointments_end_at', columns: ['endAt'], unique: false },
      { name: 'IDX_appointments_professional_id', columns: ['professional'], unique: false },
      { name: 'IDX_appointments_professional_start', columns: ['professional', 'start'], unique: false },
      { name: 'IDX_appointments_service_id', columns: ['service'], unique: false },
      { name: 'IDX_appointments_start', columns: ['start'], unique: false },
    ]);
    expect(databaseColumnsFor(Appointment)).toEqual(
      expect.arrayContaining(['start', 'endAt', 'professional_id', 'service_id']),
    );
  });

  it('declares the professional area index', () => {
    expect(indicesFor(Professional)).toEqual([
      { name: 'IDX_professionals_area_id', columns: ['area'], unique: false },
    ]);
    expect(databaseColumnsFor(Professional)).toContain('area_id');
  });

  it('declares the service area index', () => {
    expect(indicesFor(ServiceOffering)).toEqual([
      { name: 'IDX_services_area_id', columns: ['area'], unique: false },
    ]);
    expect(databaseColumnsFor(ServiceOffering)).toContain('area_id');
  });

  it('resolves all index names and database columns from built metadata', () => {
    expect(resolvedIndicesFor('appointments')).toEqual([
      { name: 'IDX_appointments_end_at', columns: ['endAt'] },
      { name: 'IDX_appointments_professional_id', columns: ['professional_id'] },
      { name: 'IDX_appointments_professional_start', columns: ['professional_id', 'start'] },
      { name: 'IDX_appointments_service_id', columns: ['service_id'] },
      { name: 'IDX_appointments_start', columns: ['start'] },
    ]);
    expect(resolvedIndicesFor('professionals')).toEqual([
      { name: 'IDX_professionals_area_id', columns: ['area_id'] },
    ]);
    expect(resolvedIndicesFor('services')).toEqual([
      { name: 'IDX_services_area_id', columns: ['area_id'] },
    ]);

    const userIndices = resolvedIndicesFor('users');
    expect(userIndices).toEqual([
      { name: 'UQ_users_email_lower_generated', columns: ['email_lower'] },
    ]);
    expect(userIndices[0]?.name).not.toBe('UQ_users_email_lower');
  });
});
