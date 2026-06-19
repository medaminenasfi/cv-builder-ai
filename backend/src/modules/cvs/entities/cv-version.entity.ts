import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CVEntity } from './cv.entity';

export enum CVVersionSource {
  MANUAL = 'manual',
  IMPORT = 'import',
  AI_ENHANCED = 'ai_enhanced',
}

@Entity('cv_versions')
export class CVVersionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'cv_id', type: 'uuid' })
  cvId: string;

  @ManyToOne(() => CVEntity, (cv) => cv.versions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cv_id' })
  cv: CVEntity;

  @Column({ name: 'version_number', default: 1 })
  versionNumber: number;

  @Column({ type: 'jsonb', default: {} })
  data: Record<string, unknown>;

  @Column({ type: 'enum', enum: CVVersionSource, default: CVVersionSource.MANUAL })
  source: CVVersionSource;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
