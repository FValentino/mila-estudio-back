import express from 'express';
import { asyncRoute } from '../../../shared/http/async-route.js';
import { idParamSchema } from '../../../shared/http/id-param.schema.js';
import { createServiceSchema, replaceServiceSchema, updateServiceSchema } from '../types/service.types.js';
import {
  createService,
  getService,
  listServices,
  removeService,
  replaceService,
  updateService,
} from '../services/services.services.js';

export const servicesRouter: express.Router = express.Router();

servicesRouter.get('/', asyncRoute(async (_req, res) => {
  res.json(await listServices());
}));

servicesRouter.get('/:id', asyncRoute(async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  res.json(await getService(id));
}));

servicesRouter.post('/', asyncRoute(async (req, res) => {
  const input = createServiceSchema.parse(req.body);
  res.status(201).json(await createService(input));
}));

servicesRouter.patch('/:id', asyncRoute(async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const input = updateServiceSchema.parse(req.body);
  res.json(await updateService(id, input));
}));

servicesRouter.put('/:id', asyncRoute(async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const input = replaceServiceSchema.parse(req.body);
  res.json(await replaceService(id, input));
}));

servicesRouter.delete('/:id', asyncRoute(async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  await removeService(id);
  res.status(204).end();
}));
