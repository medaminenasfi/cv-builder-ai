import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CVEntity } from '../../cvs/entities/cv.entity';

@Entity('share_links')
export class ShareLinkEntity {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  token: string;

  @Column({ name: 'cv_id', type: 'uuid' })
  cvId: string;

  @ManyToOne(() => CVEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cv_id' })
  cv: CVEntity;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt: Date;

  @Column({ name: 'view_count', type: 'int', default: 0 })
  viewCount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
