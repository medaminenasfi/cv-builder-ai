import { Module } from '@nestjs/common';
import { CVsModule } from '../cvs/cvs.module';
import { AIController } from './ai.controller';
import { AIService } from './ai.service';
import { OpenRouterService } from './openrouter.service';

@Module({
  imports: [CVsModule],
  controllers: [AIController],
  providers: [OpenRouterService, AIService],
  exports: [OpenRouterService, AIService],
})
export class AIModule {}
