import express from 'express';
import { loginUser, registerUser } from '../services/users.services.js';
import { loginUserSchema, registerUserSchema } from '../types/user.types.js';

export const authRouter: express.Router = express.Router();

authRouter.post('/register', async (req, res, next) => {
  try {
    const input = registerUserSchema.parse(req.body);
    res.status(201).json(await registerUser(input));
  } catch (error) {
    next(error);
  }
});

authRouter.post('/login', async (req, res, next) => {
  try {
    const input = loginUserSchema.parse(req.body);
    res.json(await loginUser(input));
  } catch (error) {
    next(error);
  }
});
