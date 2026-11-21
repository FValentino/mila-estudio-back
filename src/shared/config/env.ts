import { config } from 'dotenv';
import { IANAZone } from 'luxon';

const DEFAULT_TIMEZONE = 'America/Argentina/Buenos_Aires';

export interface Env {
  PORT: number;
  DB_HOST: string;
  DB_PORT: number;
  DB_USER: string;
  DB_PASSWORD: string;
  DB_NAME: string;
  TIMEZONE: string;
}

const REQUIRED_ENV_KEYS = ['PORT', 'DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'] as const;

type EnvKey = (typeof REQUIRED_ENV_KEYS)[number];

function requireString(key: EnvKey): string {
  const value = process.env[key];
  if (value === undefined || value.trim() === '') {
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
  const value = process.env['TIMEZONE']?.trim() || DEFAULT_TIMEZONE;
  if (!IANAZone.isValidZone(value)) {
    throw new Error(`Environment variable TIMEZONE must be a valid IANA timezone (received "${value}")`);
  }
  return value;
}

export function loadEnv(): Env {
  config();

  const missingKeys = REQUIRED_ENV_KEYS.filter((key) => {
    const value = process.env[key];
    return value === undefined || value.trim() === '';
  });
  if (missingKeys.length > 0) {
    throw new Error(`Missing required environment variables: ${missingKeys.join(', ')}`);
  }

  return {
    PORT: requirePositiveInteger('PORT'),
    DB_HOST: requireString('DB_HOST'),
    DB_PORT: requirePositiveInteger('DB_PORT'),
    DB_USER: requireString('DB_USER'),
    DB_PASSWORD: requireString('DB_PASSWORD'),
    DB_NAME: requireString('DB_NAME'),
    TIMEZONE: readTimezone(),
  };
}

export const env: Env = loadEnv();
