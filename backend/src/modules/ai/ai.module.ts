import { Module } from '@nestjs/common';
import { CVsModule } from '../cvs/cvs.module';
import { AIController } from './ai.controller';
import { AIService } from './ai.service';

@Module({
  imports: [CVsModule],
  controllers: [AIController],
  providers: [AIService],
})
export class AIModule {}
