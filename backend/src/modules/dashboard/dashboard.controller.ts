import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/auth.guards';
import { UserEntity } from '../users/entities/user.entity';
import { DashboardStatsService } from './dashboard-stats.service';

@ApiTags('dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DashboardController {
  constructor(private readonly statsService: DashboardStatsService) {}

  @Get('stats')
  stats(@CurrentUser() user: UserEntity) {
    return this.statsService.getStats(user.id);
  }

  @Get('cv-ats-scores')
  cvAtsScores(@CurrentUser() user: UserEntity) {
    return this.statsService.getLatestAtsByCv(user.id);
  }
}
