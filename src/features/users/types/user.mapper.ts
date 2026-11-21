import type { User } from '../entities/user.entity.js';
import type { UserDto } from './user.types.js';

export function mapUserToDto(user: User): UserDto {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}
