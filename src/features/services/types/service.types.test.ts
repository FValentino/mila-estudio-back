import { describe, expect, it } from 'vitest';
import {
  createServiceSchema,
  replaceServiceSchema,
  updateServiceSchema,
} from './service.types.js';

const AREA_ID = '11111111-1111-4111-8111-111111111111';
const base = { name: 'Manicuría básica', durationMinutes: 45, areaId: AREA_ID };
const schemas = [
  ['create', createServiceSchema],
  ['update', updateServiceSchema],
  ['replace', replaceServiceSchema],
] as const;

describe.each(schemas)('%s service price', (_name, schema) => {
  it.each([99_999_999.99, 1500.12])('accepts %f', (price) => {
    expect(schema.safeParse({ ...base, price }).success).toBe(true);
  });

  it.each([1e12, 1500.129, -1])('rejects %f', (price) => {
    const result = schema.safeParse({ ...base, price });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.length).toBeGreaterThan(0);
    }
  });

  it('reports the two-decimal rule for 1500.129', () => {
    const result = schema.safeParse({ ...base, price: 1500.129 });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.message.includes('2 decimal places'))).toBe(true);
    }
  });
});
