import { z } from 'zod';

export interface ServiceDto {
  id: string;
  name: string;
  durationMinutes: number;
  areaId: string;
  createdAt: string;
  updatedAt: string;
}

export const createServiceSchema = z.object({
  name: z.string().trim().min(1).max(150),
  durationMinutes: z.number().int().positive().max(1440),
  areaId: z.uuid(),
});

export const updateServiceSchema = createServiceSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  'At least one field is required',
);

export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
