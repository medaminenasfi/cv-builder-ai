import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
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
