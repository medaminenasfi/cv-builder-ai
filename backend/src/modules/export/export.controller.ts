import { Body, Controller, Get, Param, Post, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/auth.guards';
import { PreviewCVDto } from '../cvs/dto/cv.dto';
import { UserEntity } from '../users/entities/user.entity';
import { ExportService } from './export.service';

@ApiTags('export')
@Controller('cvs')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Get(':id/export/html')
  exportHtml(@Param('id') id: string, @CurrentUser() user: UserEntity) {
    return this.exportService.exportHtml(id, user.id);
  }

  @Get(':id/export/pdf')
  @ApiOperation({ summary: 'Export CV as A4 PDF (server-side)' })
  async exportPdf(
    @Param('id') id: string,
    @CurrentUser() user: UserEntity,
    @Res() res: Response,
  ) {
    const buffer = await this.exportService.exportPdf(id, user.id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="resume.pdf"');
    res.send(buffer);
  }

  @Get(':id/export/pdf/url')
  @ApiOperation({ summary: 'Save PDF to local storage and return download URL' })
  exportPdfUrl(@Param('id') id: string, @CurrentUser() user: UserEntity) {
    return this.exportService.exportPdfToStorage(id, user.id);
  }

  @Get(':id/export/docx')
  @ApiOperation({ summary: 'Export CV as DOCX' })
  async exportDocx(
    @Param('id') id: string,
    @CurrentUser() user: UserEntity,
    @Res() res: Response,
  ) {
    const buffer = await this.exportService.exportDocx(id, user.id);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    );
    res.setHeader('Content-Disposition', 'attachment; filename="resume.docx"');
    res.send(buffer);
  }

  @Get(':id/export/docx/url')
  @ApiOperation({ summary: 'Save DOCX to local storage and return download URL' })
  exportDocxUrl(@Param('id') id: string, @CurrentUser() user: UserEntity) {
    return this.exportService.exportDocxToStorage(id, user.id);
  }

  @Get(':id/preview')
  @ApiOperation({ summary: 'Preview CV with saved data and template' })
  previewSaved(@Param('id') id: string, @CurrentUser() user: UserEntity) {
    return this.exportService.renderCVHtml(id, user.id);
  }

  @Post(':id/preview')
  @ApiOperation({ summary: 'Live preview with draft CV data (editor)' })
  previewDraft(
    @Param('id') id: string,
    @Body() dto: PreviewCVDto,
    @CurrentUser() user: UserEntity,
  ) {
    return this.exportService.renderCVHtml(id, user.id, {
      data: dto.data,
      templateId: dto.templateId,
    });
  }
}
