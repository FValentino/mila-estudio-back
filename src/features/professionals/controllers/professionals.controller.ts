import express from 'express';
import { requireAdmin } from '../../../shared/http/require-admin.js';
import { requireAuth } from '../../../shared/http/require-auth.js';
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

professionalsRouter.get('/', async (_req, res, next) => {
  try {
    res.json(await listProfessionals());
  } catch (error) {
    next(error);
  }
});

professionalsRouter.get('/:id', async (req, res, next) => {
  try {
    const { id } = idParamSchema.parse(req.params);
    res.json(await getProfessional(id));
  } catch (error) {
    next(error);
  }
});

professionalsRouter.post('/', requireAuth, async (req, res, next) => {
  try {
    const input = createProfessionalSchema.parse(req.body);
    res.status(201).json(await createProfessional(input));
  } catch (error) {
    next(error);
  }
});

professionalsRouter.patch('/:id', requireAuth, async (req, res, next) => {
  try {
    const { id } = idParamSchema.parse(req.params);
    const input = updateProfessionalSchema.parse(req.body);
    res.json(await updateProfessional(id, input));
  } catch (error) {
    next(error);
  }
});

professionalsRouter.put('/:id', requireAuth, async (req, res, next) => {
  try {
    const { id } = idParamSchema.parse(req.params);
    const input = replaceProfessionalSchema.parse(req.body);
    res.json(await replaceProfessional(id, input));
  } catch (error) {
    next(error);
  }
});

professionalsRouter.delete('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { id } = idParamSchema.parse(req.params);
    await removeProfessional(id);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});
