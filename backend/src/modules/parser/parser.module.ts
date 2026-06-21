import { Module } from '@nestjs/common';
import { AIModule } from '../ai/ai.module';
import { CVsModule } from '../cvs/cvs.module';
import { CVImportController } from './cv-import.controller';
import { ParserController } from './parser.controller';
import { ParserService } from './parser.service';

@Module({
  imports: [CVsModule, AIModule],
  controllers: [ParserController, CVImportController],
  providers: [ParserService],
})
export class ParserModule {}
