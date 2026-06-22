import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity';

export enum TemplateEngine {
  LATEX = 'latex',
  HTML = 'html',
}

@Entity('templates')
export class TemplateEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  slug: string;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: TemplateEngine, default: TemplateEngine.LATEX })
  engine: TemplateEngine;

  @Column({ name: 'latex_source', type: 'text', nullable: true })
  latexSource: string | null;

  @Column({ name: 'html_structure', type: 'text', nullable: true })
  htmlStructure: string | null;

  @Column({ type: 'text', nullable: true })
  css: string | null;

  @Column({ name: 'thumbnail_url', type: 'varchar', nullable: true })
  thumbnailUrl: string | null;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'supports_rtl', default: false })
  supportsRtl: boolean;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy: string | null;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  creator: UserEntity | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
