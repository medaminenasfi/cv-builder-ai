import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('export_logs')
export class ExportLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'uuid', nullable: true })
  cvId!: string | null;

  @Column({ type: 'varchar', length: 16 })
  format!: 'pdf' | 'docx' | 'html';

  @CreateDateColumn()
  createdAt!: Date;
}
