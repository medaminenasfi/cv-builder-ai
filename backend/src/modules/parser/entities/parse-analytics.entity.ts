import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('parse_analytics')
export class ParseAnalyticsEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'uuid', nullable: true })
  cvId!: string | null;

  @Column({ type: 'varchar', length: 32 })
  mimeType!: string;

  @Column({ type: 'int' })
  durationMs!: number;

  @Column({ type: 'boolean', default: false })
  usedOcr!: boolean;

  @Column({ type: 'boolean', default: false })
  usedAi!: boolean;

  @Column({ type: 'int', default: 0 })
  confidenceScore!: number;

  @Column({ type: 'varchar', length: 32, nullable: true })
  qualityLabel!: string | null;

  @Column({ type: 'varchar', length: 8, default: 'en' })
  detectedLocale!: string;

  @Column({ type: 'jsonb', default: [] })
  warnings!: string[];

  @CreateDateColumn()
  createdAt!: Date;
}
