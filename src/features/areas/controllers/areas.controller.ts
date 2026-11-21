import express from 'express';
import { asyncRoute } from '../../../shared/http/async-route.js';
import { idParamSchema } from '../../../shared/http/id-param.schema.js';
import { createAreaSchema, replaceAreaSchema, updateAreaSchema } from '../types/area.types.js';
import { createArea, getArea, listAreas, removeArea, replaceArea, updateArea } from '../services/areas.services.js';

export const areasRouter: express.Router = express.Router();

areasRouter.get('/', asyncRoute(async (_req, res) => {
  res.json(await listAreas());
}));

areasRouter.get('/:id', asyncRoute(async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  res.json(await getArea(id));
}));

areasRouter.post('/', asyncRoute(async (req, res) => {
  const input = createAreaSchema.parse(req.body);
  res.status(201).json(await createArea(input));
}));

areasRouter.patch('/:id', asyncRoute(async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const input = updateAreaSchema.parse(req.body);
  res.json(await updateArea(id, input));
}));

areasRouter.put('/:id', asyncRoute(async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const input = replaceAreaSchema.parse(req.body);
  res.json(await replaceArea(id, input));
}));

areasRouter.delete('/:id', asyncRoute(async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  await removeArea(id);
  res.status(204).end();
}));
