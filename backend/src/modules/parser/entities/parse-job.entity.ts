import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ParseJobStatus } from '../parse-job.types';

@Entity('parse_jobs')
export class ParseJobEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'cv_id', type: 'uuid', nullable: true })
  cvId: string | null;

  @Column({ type: 'varchar', default: ParseJobStatus.PENDING })
  status: ParseJobStatus;

  @Column({ name: 'file_name', type: 'varchar', nullable: true })
  fileName: string | null;

  @Column({ name: 'mime_type', type: 'varchar', nullable: true })
  mimeType: string | null;

  @Column({ type: 'text', nullable: true })
  error: string | null;

  @Column({ type: 'jsonb', nullable: true })
  result: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
