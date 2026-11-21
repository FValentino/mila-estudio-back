import { z } from 'zod';

const MAX_PRICE = 99_999_999.99;

function hasAtMostTwoDecimals(value: number): boolean {
  const scaled = value * 100;
  const rounded = Math.round(scaled);
  return Math.abs(scaled - rounded) <= Number.EPSILON * Math.abs(scaled) * 4;
}

const priceSchema = z.number()
  .nonnegative()
  .max(MAX_PRICE)
  .refine(hasAtMostTwoDecimals, 'Price must have at most 2 decimal places');

export interface ServiceDto {
  id: string;
  name: string;
  durationMinutes: number;
  price: number;
  areaId: string;
  createdAt: string;
  updatedAt: string;
}

export const createServiceSchema = z.object({
  name: z.string().trim().min(1).max(150),
  durationMinutes: z.number().int().positive().max(1440),
  price: priceSchema,
  areaId: z.uuid(),
});

export const updateServiceSchema = createServiceSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  'At least one field is required',
);

export const replaceServiceSchema = z.object({
  name: z.string().trim().min(1).max(150),
  durationMinutes: z.number().int().positive().max(1440),
  price: priceSchema,
  areaId: z.uuid(),
});

export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
export type ReplaceServiceInput = z.infer<typeof replaceServiceSchema>;
