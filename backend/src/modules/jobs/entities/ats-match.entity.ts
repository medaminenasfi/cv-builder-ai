import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('ats_matches')
@Index(['cvId', 'createdAt'])
export class AtsMatchEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'cv_id', type: 'uuid' })
  cvId: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'job_title', type: 'varchar', nullable: true })
  jobTitle: string | null;

  @Column({ name: 'job_description', type: 'text' })
  jobDescription: string;

  @Column({ type: 'int' })
  score: number;

  @Column({ type: 'jsonb', default: {} })
  breakdown: Record<string, number>;

  @Column({ name: 'matched_keywords', type: 'jsonb', default: [] })
  matchedKeywords: string[];

  @Column({ name: 'missing_keywords', type: 'jsonb', default: [] })
  missingKeywords: string[];

  @Column({ type: 'jsonb', default: [] })
  suggestions: string[];

  @Column({ name: 'analysis_mode', type: 'varchar', default: 'ai' })
  analysisMode: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
