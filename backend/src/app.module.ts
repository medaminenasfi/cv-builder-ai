import { join } from 'path';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthController } from './health.controller';
import { AdminModule } from './modules/admin/admin.module';
import { AIModule } from './modules/ai/ai.module';
import { AuthModule } from './modules/auth/auth.module';
import { BillingModule } from './modules/billing/billing.module';
import { CVsModule } from './modules/cvs/cvs.module';
import { ExportModule } from './modules/export/export.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { ParserModule } from './modules/parser/parser.module';
import { SharingModule } from './modules/sharing/sharing.module';
import { StorageModule } from './modules/storage/storage.module';
import { UsageModule } from './modules/usage/usage.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { TemplatesModule } from './modules/templates/templates.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [join(process.cwd(), '.env'), join(__dirname, '..', '.env')],
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          url: configService.get<string>('REDIS_URL', 'redis://localhost:6379'),
        },
      }),
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DATABASE_HOST', 'localhost'),
        port: configService.get<number>('DATABASE_PORT', 55432),
        username: configService.get<string>('DATABASE_USER', 'cvbuilder'),
        password: configService.get<string>('DATABASE_PASSWORD', 'cvbuilder'),
        database: configService.get<string>('DATABASE_NAME', 'cvbuilder'),
        autoLoadEntities: true,
        synchronize: configService.get<string>('NODE_ENV') === 'development',
        logging: configService.get<string>('NODE_ENV') === 'development',
      }),
    }),
    UsersModule,
    AuthModule,
    AdminModule,
    TemplatesModule,
    CVsModule,
    ParserModule,
    ExportModule,
    AIModule,
    JobsModule,
    SharingModule,
    BillingModule,
    StorageModule,
    UsageModule,
    DashboardModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
