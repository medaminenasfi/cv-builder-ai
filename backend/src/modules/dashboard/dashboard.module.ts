import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CVEntity } from '../cvs/entities/cv.entity';
import { AtsMatchEntity } from '../jobs/entities/ats-match.entity';
import { AiUsageEntity } from '../usage/entities/ai-usage.entity';
import { ShareLinkEntity } from '../sharing/entities/share-link.entity';
import { DashboardController } from './dashboard.controller';
import { DashboardStatsService } from './dashboard-stats.service';
import { ExportLogEntity } from './entities/export-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CVEntity,
      AtsMatchEntity,
      AiUsageEntity,
      ShareLinkEntity,
      ExportLogEntity,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardStatsService],
  exports: [DashboardStatsService],
})
export class DashboardModule {}
