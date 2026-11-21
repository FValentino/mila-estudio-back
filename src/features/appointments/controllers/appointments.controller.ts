import express from 'express';
import { idParamSchema } from '../../../shared/http/id-param.schema.js';
import {
  createAppointmentSchema,
  listAppointmentsQuerySchema,
  replaceAppointmentSchema,
  updateAppointmentStatusSchema,
} from '../types/appointment.types.js';
import {
  createAppointment,
  getAppointment,
  listAppointments,
  removeAppointment,
  replaceAppointment,
  updateAppointmentStatus,
} from '../services/appointments.services.js';

export const appointmentsRouter: express.Router = express.Router();

appointmentsRouter.get('/', async (req, res, next) => {
  try {
    const query = listAppointmentsQuerySchema.parse(req.query);
    res.json(await listAppointments(query));
  } catch (error) {
    next(error);
  }
});

appointmentsRouter.get('/:id', async (req, res, next) => {
  try {
    const { id } = idParamSchema.parse(req.params);
    res.json(await getAppointment(id));
  } catch (error) {
    next(error);
  }
});

appointmentsRouter.post('/', async (req, res, next) => {
  try {
    const input = createAppointmentSchema.parse(req.body);
    res.status(201).json(await createAppointment(input));
  } catch (error) {
    next(error);
  }
});

appointmentsRouter.put('/:id', async (req, res, next) => {
  try {
    const { id } = idParamSchema.parse(req.params);
    const input = replaceAppointmentSchema.parse(req.body);
    res.json(await replaceAppointment(id, input));
  } catch (error) {
    next(error);
  }
});

appointmentsRouter.patch('/:id/status', async (req, res, next) => {
  try {
    const { id } = idParamSchema.parse(req.params);
    const { status } = updateAppointmentStatusSchema.parse(req.body);
    res.json(await updateAppointmentStatus(id, status));
  } catch (error) {
    next(error);
  }
});

appointmentsRouter.delete('/:id', async (req, res, next) => {
  try {
    const { id } = idParamSchema.parse(req.params);
    await removeAppointment(id);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});
