import express from 'express';
import { asyncRoute } from '../../../shared/http/async-route.js';
import { idParamSchema } from '../../../shared/http/id-param.schema.js';
import {
  createProfessionalSchema,
  replaceProfessionalSchema,
  updateProfessionalSchema,
} from '../types/professional.types.js';
import {
  createProfessional,
  getProfessional,
  listProfessionals,
  removeProfessional,
  replaceProfessional,
  updateProfessional,
} from '../services/professionals.services.js';

export const professionalsRouter: express.Router = express.Router();

professionalsRouter.get('/', asyncRoute(async (_req, res) => {
  res.json(await listProfessionals());
}));

professionalsRouter.get('/:id', asyncRoute(async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  res.json(await getProfessional(id));
}));

professionalsRouter.post('/', asyncRoute(async (req, res) => {
  const input = createProfessionalSchema.parse(req.body);
  res.status(201).json(await createProfessional(input));
}));

professionalsRouter.patch('/:id', asyncRoute(async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const input = updateProfessionalSchema.parse(req.body);
  res.json(await updateProfessional(id, input));
}));

professionalsRouter.put('/:id', asyncRoute(async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const input = replaceProfessionalSchema.parse(req.body);
  res.json(await replaceProfessional(id, input));
}));

professionalsRouter.delete('/:id', asyncRoute(async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  await removeProfessional(id);
  res.status(204).end();
}));
