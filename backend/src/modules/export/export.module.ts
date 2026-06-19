import { Module } from '@nestjs/common';
import { CVsModule } from '../cvs/cvs.module';
import { TemplatesModule } from '../templates/templates.module';
import { ExportController } from './export.controller';
import { ExportService } from './export.service';

@Module({
  imports: [CVsModule, TemplatesModule],
  controllers: [ExportController],
  providers: [ExportService],
})
export class ExportModule {}
