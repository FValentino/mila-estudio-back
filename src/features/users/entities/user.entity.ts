import 'reflect-metadata';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { UserRole } from '../types/user.types.js';

@Index('UQ_users_email_lower_generated', ['emailLower'], { unique: true })
@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @Column({
    name: 'email_lower',
    type: 'varchar',
    length: 255,
    asExpression: 'lower("email")',
    generatedType: 'STORED',
    insert: false,
    update: false,
    select: false,
  })
  emailLower!: string;

  @Column({ type: 'varchar', length: 255 })
  passwordHash!: string;

  @Column({ type: 'varchar', length: 10, default: 'user' })
  role!: UserRole;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @BeforeInsert()
  @BeforeUpdate()
  normalizeEmail(): void {
    if (typeof this.email !== 'string') {
      return;
    }
    this.email = this.email.trim().toLowerCase();
  }
}
