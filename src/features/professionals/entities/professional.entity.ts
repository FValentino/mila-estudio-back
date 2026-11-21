import 'reflect-metadata';
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, RelationId, UpdateDateColumn } from 'typeorm';
import { Area } from '../../areas/entities/area.entity.js';

@Entity({ name: 'professionals' })
export class Professional {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 120 })
  firstName!: string;

  @Column({ type: 'varchar', length: 120 })
  lastName!: string;

  @ManyToOne(() => Area, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'area_id' })
  area!: Area;

  @RelationId((professional: Professional) => professional.area)
  areaId!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
