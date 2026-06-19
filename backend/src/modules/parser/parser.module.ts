import { Module } from '@nestjs/common';
import { CVsModule } from '../cvs/cvs.module';
import { ParserController } from './parser.controller';
import { ParserService } from './parser.service';

@Module({
  imports: [CVsModule],
  controllers: [ParserController],
  providers: [ParserService],
})
export class ParserModule {}
