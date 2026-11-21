import express from 'express';
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

areasRouter.post('/', async (req, res, next) => {
  try {
    const input = createAreaSchema.parse(req.body);
    res.status(201).json(await createArea(input));
  } catch (error) {
    next(error);
  }
});

areasRouter.patch('/:id', async (req, res, next) => {
  try {
    const { id } = idParamSchema.parse(req.params);
    const input = updateAreaSchema.parse(req.body);
    res.json(await updateArea(id, input));
  } catch (error) {
    next(error);
  }
});

areasRouter.put('/:id', async (req, res, next) => {
  try {
    const { id } = idParamSchema.parse(req.params);
    const input = replaceAreaSchema.parse(req.body);
    res.json(await replaceArea(id, input));
  } catch (error) {
    next(error);
  }
});

areasRouter.delete('/:id', async (req, res, next) => {
  try {
    const { id } = idParamSchema.parse(req.params);
    await removeArea(id);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});
