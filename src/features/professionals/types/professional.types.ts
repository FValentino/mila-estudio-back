import { z } from 'zod';

export interface ProfessionalDto {
  id: string;
  firstName: string;
  lastName: string;
  areaId: string;
  createdAt: string;
  updatedAt: string;
}

export const createProfessionalSchema = z.object({
  firstName: z.string().trim().min(1).max(120),
  lastName: z.string().trim().min(1).max(120),
  areaId: z.uuid(),
});

export const updateProfessionalSchema = createProfessionalSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  'At least one field is required',
);

export const replaceProfessionalSchema = z.object({
  firstName: z.string().trim().min(1).max(120),
  lastName: z.string().trim().min(1).max(120),
  areaId: z.uuid(),
});

export type CreateProfessionalInput = z.infer<typeof createProfessionalSchema>;
export type UpdateProfessionalInput = z.infer<typeof updateProfessionalSchema>;
export type ReplaceProfessionalInput = z.infer<typeof replaceProfessionalSchema>;
