import { Module } from '@nestjs/common';
import { CVsModule } from '../cvs/cvs.module';
import { DashboardModule } from '../dashboard/dashboard.module';
import { LatexModule } from '../latex/latex.module';
import { TemplatesModule } from '../templates/templates.module';
import { DocxExportService } from './docx-export.service';
import { ExportController } from './export.controller';
import { ExportService } from './export.service';

@Module({
  imports: [CVsModule, TemplatesModule, DashboardModule, LatexModule],
  controllers: [ExportController],
  providers: [ExportService, DocxExportService],
  exports: [ExportService],
})
export class ExportModule {}
