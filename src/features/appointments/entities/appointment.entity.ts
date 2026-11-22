import 'reflect-metadata';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  RelationId,
  UpdateDateColumn,
} from 'typeorm';
import { Professional } from '../../professionals/entities/professional.entity.js';
import { ServiceOffering } from '../../services/entities/service.entity.js';
import { AppointmentStatus } from '../types/appointment.types.js';

@Index('IDX_appointments_professional_start', ['professional', 'start'])
@Index('IDX_appointments_start', ['start'])
@Index('IDX_appointments_end_at', ['endAt'])
@Index('IDX_appointments_professional_id', ['professional'])
@Index('IDX_appointments_service_id', ['service'])
@Entity({ name: 'appointments' })
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Professional, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'professional_id' })
  professional!: Professional;

  @RelationId((appointment: Appointment) => appointment.professional)
  professionalId!: string;

  @ManyToOne(() => ServiceOffering, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'service_id' })
  service!: ServiceOffering;

  @RelationId((appointment: Appointment) => appointment.service)
  serviceId!: string;

  @Column({ type: 'timestamptz' })
  start!: Date;

  @Column({ type: 'timestamptz' })
  endAt!: Date;

  @Column({ type: 'varchar', length: 150 })
  clientName!: string;

  @Column({ type: 'varchar', length: 50 })
  clientPhone!: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  clientEmail!: string | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column({ type: 'enum', enum: AppointmentStatus, default: AppointmentStatus.CONFIRMED })
  status!: AppointmentStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
