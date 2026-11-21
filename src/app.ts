import express, { json } from 'express';
import { appointmentsRouter } from './features/appointments/controllers/appointments.controller.js';
import { areasRouter } from './features/areas/controllers/areas.controller.js';
import { professionalsRouter } from './features/professionals/controllers/professionals.controller.js';
import { servicesRouter } from './features/services/controllers/services.controller.js';
import { authRouter } from './features/users/controllers/auth.controller.js';
import { errorHandler, sendError } from './shared/http/error-response.js';

export const app: express.Express = express();

app.use(json());

app.use((req, _res, next) => {
  console.log(req.method, req.originalUrl);
  next();
});

app.use('/api/auth', authRouter);
app.use('/api/areas', areasRouter);
app.use('/api/professionals', professionalsRouter);
app.use('/api/services', servicesRouter);
app.use('/api/appointments', appointmentsRouter);

app.use((_req, res) => {
  sendError(res, 404, 'Route not found');
});

app.use(errorHandler);
