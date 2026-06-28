import { Body, Controller, Get, Param, Post, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/auth.guards';
import { UserEntity } from '../users/entities/user.entity';
import { SharingService } from './sharing.service';

@ApiTags('sharing')
@Controller()
export class SharingController {
  constructor(private readonly sharingService: SharingService) {}

  @Post('cvs/:id/share')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  create(
    @Param('id') id: string,
    @Body() body: { displayName?: string },
    @CurrentUser() user: UserEntity,
  ) {
    return this.sharingService.createLink(id, user.id, body.displayName);
  }

  @Get('share/:token')
  view(@Param('token') token: string) {
    return this.sharingService.getByToken(token);
  }

  @Get('share/:token/export/pdf')
  async exportPdf(@Param('token') token: string, @Res() res: Response) {
    const buffer = await this.sharingService.exportPdfByToken(token);
    if (!buffer) {
      res.status(410).json({ message: 'Share link expired or not found' });
      return;
    }
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="shared-resume.pdf"');
    res.send(buffer);
  }
}
