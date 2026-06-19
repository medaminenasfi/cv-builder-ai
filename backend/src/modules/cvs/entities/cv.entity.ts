import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity';
import { CVVersionEntity } from '../../cvs/entities/cv-version.entity';

@Entity('cvs')
export class CVEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ name: 'template_id', type: 'uuid', nullable: true })
  templateId: string | null;

  @Column({ type: 'varchar' })
  title: string;

  @Column({ type: 'varchar', default: 'en' })
  locale: string;

  @Column({ name: 'job_title_target', type: 'varchar', nullable: true })
  jobTitleTarget: string | null;

  @OneToMany(() => CVVersionEntity, (v) => v.cv)
  versions: CVVersionEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
