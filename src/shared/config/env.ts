import { config } from 'dotenv';
import { IANAZone } from 'luxon';

const DEFAULT_TIMEZONE = 'America/Argentina/Buenos_Aires';
const REQUIRED_ENV_KEYS = ['PORT', 'JWT_SECRET', 'DATABASE_URL'] as const;
const SEED_ENV_KEYS = ['ADMIN_EMAIL', 'ADMIN_PASSWORD'] as const;

type EnvKey = (typeof REQUIRED_ENV_KEYS)[number] | (typeof SEED_ENV_KEYS)[number];

export interface Env {
  PORT: number;
  JWT_SECRET: string;
  DATABASE_URL: string;
  ADMIN_EMAIL?: string;
  ADMIN_PASSWORD?: string;
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

  const missingKeys = REQUIRED_ENV_KEYS.filter((key) => readValue(key) === undefined);
  if (missingKeys.length > 0) {
    throw new Error(`Missing required environment variables: ${missingKeys.join(', ')}`);
  }

  const adminEmail = readValue('ADMIN_EMAIL');
  const adminPassword = readValue('ADMIN_PASSWORD');

  return {
    PORT: requirePositiveInteger('PORT'),
    JWT_SECRET: requireString('JWT_SECRET'),
    DATABASE_URL: requireString('DATABASE_URL'),
    ...(adminEmail === undefined ? {} : { ADMIN_EMAIL: adminEmail }),
    ...(adminPassword === undefined ? {} : { ADMIN_PASSWORD: adminPassword }),
    TIMEZONE: readTimezone(),
  };
}

export const env: Env = loadEnv();
