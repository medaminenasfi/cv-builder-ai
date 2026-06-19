import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/auth.guards';
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
}
