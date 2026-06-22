import { Module } from '@nestjs/common';
import { CVsModule } from '../cvs/cvs.module';
import { DashboardModule } from '../dashboard/dashboard.module';
import { TemplatesModule } from '../templates/templates.module';
import { DocxExportService } from './docx-export.service';
import { ExportController } from './export.controller';
import { ExportService } from './export.service';

@Module({
  imports: [CVsModule, TemplatesModule, DashboardModule],
  controllers: [ExportController],
  providers: [ExportService, DocxExportService],
  exports: [ExportService],
})
export class ExportModule {}
