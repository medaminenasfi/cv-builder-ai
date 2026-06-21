import { Module } from '@nestjs/common';
import { AIModule } from '../ai/ai.module';
import { CVsModule } from '../cvs/cvs.module';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';

@Module({
  imports: [CVsModule, AIModule],
  controllers: [JobsController],
  providers: [JobsService],
})
export class JobsModule {}
