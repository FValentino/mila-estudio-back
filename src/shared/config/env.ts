import { config } from 'dotenv';
import { IANAZone } from 'luxon';

const DEFAULT_TIMEZONE = 'America/Argentina/Buenos_Aires';
const DATABASE_ENV_KEYS = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'] as const;
const REQUIRED_ENV_KEYS = ['PORT'] as const;

type EnvKey = (typeof REQUIRED_ENV_KEYS)[number] | (typeof DATABASE_ENV_KEYS)[number];

export interface Env {
  PORT: number;
  DB_HOST?: string;
  DB_PORT?: number;
  DB_USER?: string;
  DB_PASSWORD?: string;
  DB_NAME?: string;
  DATABASE_URL?: string;
  TIMEZONE: string;
}

function readValue(key: string): string | undefined {
  const value = process.env[key]?.trim();
  return value === undefined || value === '' ? undefined : value;
}

function requireString(key: EnvKey): string {
  const value = readValue(key);
  if (value === undefined) {
    throw new Error(`Environment variable ${key} is required`);
  }
  return value;
}

function requirePositiveInteger(key: EnvKey): number {
  const value = Number(requireString(key));
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`Environment variable ${key} must be a positive integer`);
  }
  return value;
}

function readTimezone(): string {
  const value = readValue('TIMEZONE') ?? DEFAULT_TIMEZONE;
  if (!IANAZone.isValidZone(value)) {
    throw new Error(`Environment variable TIMEZONE must be a valid IANA timezone (received "${value}")`);
  }
  return value;
}

export function loadEnv(): Env {
  config();

  const databaseUrl = readValue('DATABASE_URL');
  const requiredKeys: readonly EnvKey[] = databaseUrl === undefined
    ? [...REQUIRED_ENV_KEYS, ...DATABASE_ENV_KEYS]
    : REQUIRED_ENV_KEYS;

  const missingKeys = requiredKeys.filter((key) => readValue(key) === undefined);
  if (missingKeys.length > 0) {
    throw new Error(`Missing required environment variables: ${missingKeys.join(', ')}`);
  }

  const databaseConfig = databaseUrl === undefined
    ? {
        DB_HOST: requireString('DB_HOST'),
        DB_PORT: requirePositiveInteger('DB_PORT'),
        DB_USER: requireString('DB_USER'),
        DB_PASSWORD: requireString('DB_PASSWORD'),
        DB_NAME: requireString('DB_NAME'),
      }
    : {};

  return {
    PORT: requirePositiveInteger('PORT'),
    ...databaseConfig,
    ...(databaseUrl === undefined ? {} : { DATABASE_URL: databaseUrl }),
    TIMEZONE: readTimezone(),
  };
}

export const env: Env = loadEnv();
