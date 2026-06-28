import { Module } from '@nestjs/common';
import { CVsModule } from '../cvs/cvs.module';
import { UsageModule } from '../usage/usage.module';
import { UsersModule } from '../users/users.module';
import { AIController } from './ai.controller';
import { AIService } from './ai.service';
import { OpenRouterService } from './openrouter.service';

@Module({
  imports: [CVsModule, UsageModule, UsersModule],
  controllers: [AIController],
  providers: [OpenRouterService, AIService],
  exports: [OpenRouterService, AIService],
})
export class AIModule {}
