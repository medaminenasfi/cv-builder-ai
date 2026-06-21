import {
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { existsSync } from 'fs';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/auth.guards';
import { UserEntity } from '../users/entities/user.entity';
import { LocalStorageService } from './local-storage.service';

@ApiTags('files')
@Controller('files')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FilesController {
  constructor(private readonly localStorage: LocalStorageService) {}

  @Get('exports/:userId/:filename')
  async downloadExport(
    @Param('userId') userId: string,
    @Param('filename') filename: string,
    @CurrentUser() user: UserEntity,
    @Res() res: Response,
  ) {
    if (user.id !== userId && user.role !== 'admin') {
      throw new ForbiddenException('Access denied');
    }

    const relativePath = `exports/${userId}/${filename}`;
    const abs = this.localStorage.getAbsolutePath(relativePath);
    if (!existsSync(abs)) {
      throw new NotFoundException('File not found');
    }

    if (filename.endsWith('.pdf')) {
      res.setHeader('Content-Type', 'application/pdf');
    } else if (filename.endsWith('.docx')) {
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      );
    }

    return res.sendFile(abs);
  }
}
