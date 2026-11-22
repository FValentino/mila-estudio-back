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
import { Area } from '../../areas/entities/area.entity.js';

@Index('IDX_services_area_id', ['area'])
@Entity({ name: 'services' })
export class ServiceOffering {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 150 })
  name!: string;

  @Column({ type: 'int' })
  durationMinutes!: number;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  price!: string;

  @ManyToOne(() => Area, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'area_id' })
  area!: Area;

  @RelationId((service: ServiceOffering) => service.area)
  areaId!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
