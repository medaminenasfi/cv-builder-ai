import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserLocale, UserPlan, UserRole } from '../../../common/enums/user.enum';
import { RefreshTokenEntity } from '../../auth/entities/refresh-token.entity';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'password_hash' })
  passwordHash: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Column({ type: 'enum', enum: UserPlan, default: UserPlan.FREE })
  plan: UserPlan;

  @Column({ type: 'enum', enum: UserLocale, default: UserLocale.EN })
  locale: UserLocale;

  @OneToMany(() => RefreshTokenEntity, (token) => token.user)
  refreshTokens: RefreshTokenEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
