import express from 'express';
import { requireAdmin } from '../../../shared/http/require-admin.js';
import { requireAuth } from '../../../shared/http/require-auth.js';
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

servicesRouter.get('/', async (_req, res, next) => {
  try {
    res.json(await listServices());
  } catch (error) {
    next(error);
  }
});

servicesRouter.get('/:id', async (req, res, next) => {
  try {
    const { id } = idParamSchema.parse(req.params);
    res.json(await getService(id));
  } catch (error) {
    next(error);
  }
});

servicesRouter.post('/', requireAuth, async (req, res, next) => {
  try {
    const input = createServiceSchema.parse(req.body);
    res.status(201).json(await createService(input));
  } catch (error) {
    next(error);
  }
});

servicesRouter.patch('/:id', requireAuth, async (req, res, next) => {
  try {
    const { id } = idParamSchema.parse(req.params);
    const input = updateServiceSchema.parse(req.body);
    res.json(await updateService(id, input));
  } catch (error) {
    next(error);
  }
});

servicesRouter.put('/:id', requireAuth, async (req, res, next) => {
  try {
    const { id } = idParamSchema.parse(req.params);
    const input = replaceServiceSchema.parse(req.body);
    res.json(await replaceService(id, input));
  } catch (error) {
    next(error);
  }
});

servicesRouter.delete('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { id } = idParamSchema.parse(req.params);
    await removeService(id);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});
