import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../../../shared/config/env.js';
import { ConflictError, UnauthorizedError } from '../../../shared/errors/domain-errors.js';
import { User } from '../entities/user.entity.js';
import { create, existsByEmail, findByEmail } from '../repositories/users.repository.js';
import { mapUserToDto } from '../types/user.mapper.js';
import type { LoginResult, LoginUserInput, RegisterUserInput, UserDto } from '../types/user.types.js';

const SALT_ROUNDS = 10;
const TOKEN_EXPIRATION = '7d';

export async function registerUser(input: RegisterUserInput): Promise<UserDto> {
  if (await existsByEmail(input.email)) {
    throw new ConflictError('Email is already registered');
  }

  const user = new User();
  user.email = input.email;
  user.passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
  user.role = 'user';

  return mapUserToDto(await create(user));
}

export async function loginUser(input: LoginUserInput): Promise<LoginResult> {
  const user = await findByEmail(input.email);
  if (user === null || !(await bcrypt.compare(input.password, user.passwordHash))) {
    throw new UnauthorizedError('Invalid credentials');
  }

  const token = jwt.sign(
    { sub: user.id, role: user.role },
    env.JWT_SECRET,
    { expiresIn: TOKEN_EXPIRATION },
  );

  return { token };
}
