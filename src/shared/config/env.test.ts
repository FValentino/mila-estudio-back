import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Env } from './env.js';

vi.mock('dotenv', () => ({ config: vi.fn() }));

const ORIGINAL_ENV: NodeJS.ProcessEnv = { ...process.env };
const DATABASE_URL = 'postgresql://url-user:url-pass@url-host:5432/url-db';
const JWT_SECRET = 'test-jwt-secret';
const LEGACY_DB_PREFIX = 'DB_';
const LEGACY_DB_SUFFIXES = ['HOST', 'PORT', 'USER', 'PASSWORD', 'NAME'] as const;

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

function legacyDbEnv(): Record<string, string> {
  return Object.fromEntries(
    LEGACY_DB_SUFFIXES.map((suffix) => [`${LEGACY_DB_PREFIX}${suffix}`, 'legacy-value']),
  ) as Record<string, string>;
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
  it('starts with PORT, JWT_SECRET and DATABASE_URL only', async () => {
    setEnv({ PORT: '3000', JWT_SECRET, DATABASE_URL });

    const { loadEnv } = await importEnv();
    const loaded: Env = loadEnv();

    expect(loaded).toEqual({
      PORT: 3000,
      JWT_SECRET,
      DATABASE_URL,
      TIMEZONE: 'America/Argentina/Buenos_Aires',
    });
    expect(Object.keys(loaded).filter((key) => key.startsWith(LEGACY_DB_PREFIX))).toEqual([]);
  });

  it('requires DATABASE_URL even when legacy connection variables are present', async () => {
    setEnv({ PORT: '3000', JWT_SECRET, DATABASE_URL, ...legacyDbEnv() });

    const { loadEnv } = await importEnv();
    delete process.env.DATABASE_URL;

    expect(() => loadEnv()).toThrow('Missing required environment variables: DATABASE_URL');
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

  it('configures the DataSource only with DATABASE_URL', async () => {
    setEnv({ PORT: '3000', JWT_SECRET, DATABASE_URL });

    const { loadEnv } = await importEnv();
    const loaded = loadEnv();
    const { dataSource } = await import('../database/data-source.js');
    const options = dataSource.options as unknown as Record<string, unknown>;

    expect(loaded.DATABASE_URL).toBe(DATABASE_URL);
    expect(options.type).toBe('postgres');
    expect(options.url).toBe(DATABASE_URL);
    for (const key of ['host', 'port', 'username', 'password', 'database'] as const) {
      expect(options[key]).toBeUndefined();
    }
  });
});
