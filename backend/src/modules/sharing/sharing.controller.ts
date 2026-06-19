import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
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
  create(@Param('id') id: string, @CurrentUser() user: UserEntity) {
    return this.sharingService.createLink(id, user.id);
  }

  @Get('share/:token')
  view(@Param('token') token: string) {
    return this.sharingService.getByToken(token);
  }
}
