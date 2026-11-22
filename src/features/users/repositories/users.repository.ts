import { Raw } from 'typeorm';
import type { Repository } from 'typeorm';
import { dataSource } from '../../../shared/database/data-source.js';
import { User } from '../entities/user.entity.js';

function userRepository(): Repository<User> {
  return dataSource.getRepository(User);
}

export async function findByEmail(email: string): Promise<User | null> {
  return userRepository().findOne({
    where: {
      email: Raw(
        (alias) => `lower(${alias}) = :email`,
        { email: email.trim().toLowerCase() },
      ),
    },
  });
}

export async function existsByEmail(email: string): Promise<boolean> {
  return (await findByEmail(email)) !== null;
}

export async function create(user: User): Promise<User> {
  return userRepository().save(user);
}
