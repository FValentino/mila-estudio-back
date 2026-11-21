import { z } from 'zod';

export interface AreaDto {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export const createAreaSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).nullish(),
});

export const updateAreaSchema = createAreaSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  'At least one field is required',
);

export const replaceAreaSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).nullish(),
});

export type CreateAreaInput = z.infer<typeof createAreaSchema>;
export type UpdateAreaInput = z.infer<typeof updateAreaSchema>;
export type ReplaceAreaInput = z.infer<typeof replaceAreaSchema>;
