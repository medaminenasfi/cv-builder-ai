import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AIModule } from '../ai/ai.module';
import { CVsModule } from '../cvs/cvs.module';
import { UsageModule } from '../usage/usage.module';
import { UsersModule } from '../users/users.module';
import { CVImportController } from './cv-import.controller';
import { ParseAnalyticsEntity } from './entities/parse-analytics.entity';
import { ParseJobEntity } from './entities/parse-job.entity';
import { PARSE_QUEUE, ParserQueueService } from './parser-queue.service';
import { ParserController } from './parser.controller';
import { ParserProcessor } from './parser.processor';
import { ParserService } from './parser.service';

@Module({
  imports: [
    CVsModule,
    AIModule,
    UsageModule,
    UsersModule,
    TypeOrmModule.forFeature([ParseJobEntity, ParseAnalyticsEntity]),
    BullModule.registerQueue({ name: PARSE_QUEUE }),
  ],
  controllers: [ParserController, CVImportController],
  providers: [ParserService, ParserQueueService, ParserProcessor],
  exports: [ParserService],
})
export class ParserModule {}
