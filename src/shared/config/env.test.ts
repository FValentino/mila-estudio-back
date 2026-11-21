import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Env } from './env.js';

vi.mock('dotenv', () => ({ config: vi.fn() }));

const ORIGINAL_ENV: NodeJS.ProcessEnv = { ...process.env };
const DATABASE_URL = 'postgresql://url-user:url-pass@url-host:5432/url-db';
const JWT_SECRET = 'test-jwt-secret';

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
  it('starts with PORT, JWT_SECRET and DATABASE_URL', async () => {
    setEnv({ PORT: '3000', JWT_SECRET, DATABASE_URL });

    const { loadEnv } = await importEnv();
    const loaded: Env = loadEnv();

    expect(loaded).toMatchObject({
      PORT: 3000,
      JWT_SECRET,
      DATABASE_URL,
      TIMEZONE: 'America/Argentina/Buenos_Aires',
    });
    expect(loaded.DB_HOST).toBeUndefined();
    expect(loaded.DB_PORT).toBeUndefined();
    expect(loaded.DB_USER).toBeUndefined();
    expect(loaded.DB_PASSWORD).toBeUndefined();
    expect(loaded.DB_NAME).toBeUndefined();
    expect(loaded.ADMIN_EMAIL).toBeUndefined();
    expect(loaded.ADMIN_PASSWORD).toBeUndefined();
  });

  it('requires JWT_SECRET', async () => {
    setEnv({ PORT: '3000', JWT_SECRET, DATABASE_URL });

    const { loadEnv } = await importEnv();
    delete process.env.JWT_SECRET;

    expect(() => loadEnv()).toThrow('Missing required environment variables: JWT_SECRET');
  });

  it('reads the optional admin seed variables when present', async () => {
    setEnv({
      PORT: '3000',
      JWT_SECRET,
      DATABASE_URL,
      ADMIN_EMAIL: 'admin@example.com',
      ADMIN_PASSWORD: 'admin-password',
    });

    const { loadEnv } = await importEnv();
    const loaded: Env = loadEnv();

    expect(loaded.ADMIN_EMAIL).toBe('admin@example.com');
    expect(loaded.ADMIN_PASSWORD).toBe('admin-password');
  });

  it('starts with DB_* when DATABASE_URL is absent', async () => {
    setEnv({
      PORT: '3001',
      JWT_SECRET,
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
      JWT_SECRET,
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
      JWT_SECRET,
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
