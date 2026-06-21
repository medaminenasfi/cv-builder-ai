import { Module } from '@nestjs/common';
import { CVsModule } from '../cvs/cvs.module';
import { TemplatesModule } from '../templates/templates.module';
import { DocxExportService } from './docx-export.service';
import { ExportController } from './export.controller';
import { ExportService } from './export.service';

@Module({
  imports: [CVsModule, TemplatesModule],
  controllers: [ExportController],
  providers: [ExportService, DocxExportService],
})
export class ExportModule {}
