import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Env } from './env.js';

vi.mock('dotenv', () => ({ config: vi.fn() }));

const ORIGINAL_ENV: NodeJS.ProcessEnv = { ...process.env };
const DATABASE_URL = 'postgresql://url-user:url-pass@url-host:5432/url-db';

function clearEnv(): void {
  for (const key of Object.keys(process.env)) {
    delete process.env[key];
  }
}

function setEnv(values: Record<string, string>): void {
  for (const [key, value] of Object.entries(values)) {
    process.env[key] = value;
  }
}

async function importEnv(): Promise<typeof import('./env.js')> {
  return import('./env.js');
}

beforeEach(() => {
  vi.resetModules();
  clearEnv();
});

afterEach(() => {
  clearEnv();
  Object.assign(process.env, ORIGINAL_ENV);
});

describe('loadEnv', () => {
  it('starts with only PORT and DATABASE_URL', async () => {
    setEnv({ PORT: '3000', DATABASE_URL });

    const { loadEnv } = await importEnv();
    const loaded: Env = loadEnv();

    expect(loaded).toMatchObject({ PORT: 3000, DATABASE_URL, TIMEZONE: 'America/Argentina/Buenos_Aires' });
    expect(loaded.DB_HOST).toBeUndefined();
    expect(loaded.DB_PORT).toBeUndefined();
    expect(loaded.DB_USER).toBeUndefined();
    expect(loaded.DB_PASSWORD).toBeUndefined();
    expect(loaded.DB_NAME).toBeUndefined();
  });

  it('starts with DB_* when DATABASE_URL is absent', async () => {
    setEnv({
      PORT: '3001',
      DB_HOST: 'db-host',
      DB_PORT: '5433',
      DB_USER: 'db-user',
      DB_PASSWORD: 'db-pass',
      DB_NAME: 'db-name',
    });

    const { loadEnv } = await importEnv();
    const loaded: Env = loadEnv();

    expect(loaded).toEqual({
      PORT: 3001,
      DB_HOST: 'db-host',
      DB_PORT: 5433,
      DB_USER: 'db-user',
      DB_PASSWORD: 'db-pass',
      DB_NAME: 'db-name',
      TIMEZONE: 'America/Argentina/Buenos_Aires',
    });
    expect(loaded.DATABASE_URL).toBeUndefined();
  });

  it('gives DATABASE_URL precedence when both sources are present', async () => {
    setEnv({
      PORT: '3002',
      DATABASE_URL,
      DB_HOST: 'db-host',
      DB_PORT: '5433',
      DB_USER: 'db-user',
      DB_PASSWORD: 'db-pass',
      DB_NAME: 'db-name',
    });

    const { loadEnv } = await importEnv();
    const loaded: Env = loadEnv();
    const { dataSource } = await import('../database/data-source.js');

    expect(loaded.DATABASE_URL).toBe(DATABASE_URL);
    expect(dataSource.options).toMatchObject({ type: 'postgres', url: DATABASE_URL });
  });
});
