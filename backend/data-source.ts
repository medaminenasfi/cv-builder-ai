import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { UserEntity } from './src/modules/users/entities/user.entity';
import { RefreshTokenEntity } from './src/modules/auth/entities/refresh-token.entity';

config({ path: '.env' });

export default new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST ?? 'localhost',
  port: Number(process.env.DATABASE_PORT ?? 5432),
  username: process.env.DATABASE_USER ?? 'cvbuilder',
  password: process.env.DATABASE_PASSWORD ?? 'cvbuilder',
  database: process.env.DATABASE_NAME ?? 'cvbuilder',
  entities: [UserEntity, RefreshTokenEntity],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
});
