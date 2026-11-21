import express from 'express';
import { asyncRoute } from '../../../shared/http/async-route.js';
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

appointmentsRouter.get('/', asyncRoute(async (req, res) => {
  const query = listAppointmentsQuerySchema.parse(req.query);
  res.json(await listAppointments(query));
}));

appointmentsRouter.get('/:id', asyncRoute(async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  res.json(await getAppointment(id));
}));

appointmentsRouter.post('/', asyncRoute(async (req, res) => {
  const input = createAppointmentSchema.parse(req.body);
  res.status(201).json(await createAppointment(input));
}));

appointmentsRouter.put('/:id', asyncRoute(async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const input = replaceAppointmentSchema.parse(req.body);
  res.json(await replaceAppointment(id, input));
}));

appointmentsRouter.patch('/:id/status', asyncRoute(async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const { status } = updateAppointmentStatusSchema.parse(req.body);
  res.json(await updateAppointmentStatus(id, status));
}));

appointmentsRouter.delete('/:id', asyncRoute(async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  await removeAppointment(id);
  res.status(204).end();
}));
