import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AIModule } from '../ai/ai.module';
import { CVsModule } from '../cvs/cvs.module';
import { UsageModule } from '../usage/usage.module';
import { UsersModule } from '../users/users.module';
import { AtsMatchEntity } from './entities/ats-match.entity';
import { CoverLetterEntity } from './entities/cover-letter.entity';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';

@Module({
  imports: [
    CVsModule,
    AIModule,
    UsageModule,
    UsersModule,
    TypeOrmModule.forFeature([AtsMatchEntity, CoverLetterEntity]),
  ],
  controllers: [JobsController],
  providers: [JobsService],
})
export class JobsModule {}
