import { getMetadataArgsStorage } from 'typeorm';
import { describe, expect, it } from 'vitest';
import { User } from './user.entity.js';

describe('User email schema invariants', () => {
  it('declares a unique index backed by a stored lower(email) generated column', () => {
    const storage = getMetadataArgsStorage();
    const index = storage.filterIndices(User)[0];
    const column = storage.columns.find(
      (candidate) => candidate.target === User && candidate.propertyName === 'emailLower',
    );

    expect(index).toMatchObject({
      name: 'UQ_users_email_lower_generated',
      columns: ['emailLower'],
      unique: true,
    });
    expect(index?.name).not.toBe('UQ_users_email_lower');
    expect(column?.options).toMatchObject({
      name: 'email_lower',
      asExpression: 'lower("email")',
      generatedType: 'STORED',
      insert: false,
      update: false,
      select: false,
    });
  });

  it('registers email normalization for both insert and update', () => {
    const listeners = getMetadataArgsStorage().entityListeners
      .filter((listener) => listener.target === User)
      .map((listener) => listener.propertyName);

    expect(listeners.filter((name) => name === 'normalizeEmail')).toHaveLength(2);
  });

  it('normalizes the email before persisting it', () => {
    const user = new User();
    user.email = '  ADMIN@X.COM  ';

    user.normalizeEmail();

    expect(user.email).toBe('admin@x.com');
  });

  it('does nothing when the email is absent', () => {
    const user = new User();

    expect(() => user.normalizeEmail()).not.toThrow();
    expect(user.email).toBeUndefined();
  });
});
