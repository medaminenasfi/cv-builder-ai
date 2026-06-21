import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('cover_letters')
@Index(['cvId', 'createdAt'])
export class CoverLetterEntity {
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

  @Column({ type: 'text' })
  content: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
