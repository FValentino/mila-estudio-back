import express from 'express';
import { requireAdmin } from '../../../shared/http/require-admin.js';
import { requireAuth } from '../../../shared/http/require-auth.js';
import { idParamSchema } from '../../../shared/http/id-param.schema.js';
import { createAreaSchema, replaceAreaSchema, updateAreaSchema } from '../types/area.types.js';
import { createArea, getArea, listAreas, removeArea, replaceArea, updateArea } from '../services/areas.services.js';

export const areasRouter: express.Router = express.Router();

areasRouter.get('/', async (_req, res, next) => {
  try {
    res.json(await listAreas());
  } catch (error) {
    next(error);
  }
});

areasRouter.get('/:id', async (req, res, next) => {
  try {
    const { id } = idParamSchema.parse(req.params);
    res.json(await getArea(id));
  } catch (error) {
    next(error);
  }
});

areasRouter.post('/', requireAuth, async (req, res, next) => {
  try {
    const input = createAreaSchema.parse(req.body);
    res.status(201).json(await createArea(input));
  } catch (error) {
    next(error);
  }
});

areasRouter.patch('/:id', requireAuth, async (req, res, next) => {
  try {
    const { id } = idParamSchema.parse(req.params);
    const input = updateAreaSchema.parse(req.body);
    res.json(await updateArea(id, input));
  } catch (error) {
    next(error);
  }
});

areasRouter.put('/:id', requireAuth, async (req, res, next) => {
  try {
    const { id } = idParamSchema.parse(req.params);
    const input = replaceAreaSchema.parse(req.body);
    res.json(await replaceArea(id, input));
  } catch (error) {
    next(error);
  }
});

areasRouter.delete('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { id } = idParamSchema.parse(req.params);
    await removeArea(id);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});
