import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CVEntity } from '../cvs/entities/cv.entity';
import { AtsMatchEntity } from '../jobs/entities/ats-match.entity';
import { AiUsageEntity } from '../usage/entities/ai-usage.entity';
import { ShareLinkEntity } from '../sharing/entities/share-link.entity';
import { ExportLogEntity } from './entities/export-log.entity';

export interface DashboardStats {
  totalResumes: number;
  avgAtsScore: number | null;
  jobMatchesCompleted: number;
  aiEnhancementsUsed: number;
  resumeViews: number;
  exportCount: number;
  trends: {
    resumes: number;
    atsScore: number;
    jobMatches: number;
    aiUsage: number;
    views: number;
    exports: number;
  };
}

@Injectable()
export class DashboardStatsService {
  constructor(
    @InjectRepository(CVEntity)
    private readonly cvsRepo: Repository<CVEntity>,
    @InjectRepository(AtsMatchEntity)
    private readonly atsRepo: Repository<AtsMatchEntity>,
    @InjectRepository(AiUsageEntity)
    private readonly aiUsageRepo: Repository<AiUsageEntity>,
    @InjectRepository(ShareLinkEntity)
    private readonly shareRepo: Repository<ShareLinkEntity>,
    @InjectRepository(ExportLogEntity)
    private readonly exportRepo: Repository<ExportLogEntity>,
  ) {}

  async getStats(userId: string): Promise<DashboardStats> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

    const [
      totalResumes,
      resumesLast30,
      resumesPrev30,
      atsAgg,
      atsLast30,
      atsPrev30,
      jobMatchesCompleted,
      matchesLast30,
      matchesPrev30,
      aiRows,
      aiLast30,
      aiPrev30,
      resumeViews,
      viewsLast30,
      viewsPrev30,
      exportCount,
      exportsLast30,
      exportsPrev30,
    ] = await Promise.all([
      this.cvsRepo.count({ where: { userId } }),
      this.cvsRepo
        .createQueryBuilder('cv')
        .where('cv.userId = :userId', { userId })
        .andWhere('cv.createdAt >= :since', { since: thirtyDaysAgo })
        .getCount(),
      this.cvsRepo
        .createQueryBuilder('cv')
        .where('cv.userId = :userId', { userId })
        .andWhere('cv.createdAt >= :start AND cv.createdAt < :end', {
          start: sixtyDaysAgo,
          end: thirtyDaysAgo,
        })
        .getCount(),
      this.atsRepo
        .createQueryBuilder('m')
        .select('AVG(m.score)', 'avg')
        .where('m.userId = :userId', { userId })
        .getRawOne<{ avg: string | null }>(),
      this.atsRepo
        .createQueryBuilder('m')
        .select('AVG(m.score)', 'avg')
        .where('m.userId = :userId', { userId })
        .andWhere('m.createdAt >= :since', { since: thirtyDaysAgo })
        .getRawOne<{ avg: string | null }>(),
      this.atsRepo
        .createQueryBuilder('m')
        .select('AVG(m.score)', 'avg')
        .where('m.userId = :userId', { userId })
        .andWhere('m.createdAt >= :start AND m.createdAt < :end', {
          start: sixtyDaysAgo,
          end: thirtyDaysAgo,
        })
        .getRawOne<{ avg: string | null }>(),
      this.atsRepo.count({ where: { userId } }),
      this.atsRepo
        .createQueryBuilder('m')
        .where('m.userId = :userId', { userId })
        .andWhere('m.createdAt >= :since', { since: thirtyDaysAgo })
        .getCount(),
      this.atsRepo
        .createQueryBuilder('m')
        .where('m.userId = :userId', { userId })
        .andWhere('m.createdAt >= :start AND m.createdAt < :end', {
          start: sixtyDaysAgo,
          end: thirtyDaysAgo,
        })
        .getCount(),
      this.aiUsageRepo.find({ where: { userId } }),
      this.aiUsageRepo
        .createQueryBuilder('u')
        .select('SUM(u.callCount)', 'total')
        .where('u.userId = :userId', { userId })
        .andWhere('u.usageDate >= :since', { since: thirtyDaysAgo.toISOString().slice(0, 10) })
        .getRawOne<{ total: string | null }>(),
      this.aiUsageRepo
        .createQueryBuilder('u')
        .select('SUM(u.callCount)', 'total')
        .where('u.userId = :userId', { userId })
        .andWhere('u.usageDate >= :start AND u.usageDate < :end', {
          start: sixtyDaysAgo.toISOString().slice(0, 10),
          end: thirtyDaysAgo.toISOString().slice(0, 10),
        })
        .getRawOne<{ total: string | null }>(),
      this.shareRepo
        .createQueryBuilder('s')
        .innerJoin('cvs', 'cv', 'cv.id = s.cvId')
        .select('COALESCE(SUM(s.viewCount), 0)', 'total')
        .where('cv.userId = :userId', { userId })
        .getRawOne<{ total: string }>(),
      this.shareRepo
        .createQueryBuilder('s')
        .innerJoin('cvs', 'cv', 'cv.id = s.cvId')
        .select('COALESCE(SUM(s.viewCount), 0)', 'total')
        .where('cv.userId = :userId', { userId })
        .andWhere('s.updatedAt >= :since', { since: thirtyDaysAgo })
        .getRawOne<{ total: string }>(),
      this.shareRepo
        .createQueryBuilder('s')
        .innerJoin('cvs', 'cv', 'cv.id = s.cvId')
        .select('COALESCE(SUM(s.viewCount), 0)', 'total')
        .where('cv.userId = :userId', { userId })
        .andWhere('s.updatedAt >= :start AND s.updatedAt < :end', {
          start: sixtyDaysAgo,
          end: thirtyDaysAgo,
        })
        .getRawOne<{ total: string }>(),
      this.exportRepo.count({ where: { userId } }),
      this.exportRepo
        .createQueryBuilder('e')
        .where('e.userId = :userId', { userId })
        .andWhere('e.createdAt >= :since', { since: thirtyDaysAgo })
        .getCount(),
      this.exportRepo
        .createQueryBuilder('e')
        .where('e.userId = :userId', { userId })
        .andWhere('e.createdAt >= :start AND e.createdAt < :end', {
          start: sixtyDaysAgo,
          end: thirtyDaysAgo,
        })
        .getCount(),
    ]);

    const aiEnhancementsUsed = aiRows.reduce((sum, r) => sum + r.callCount, 0);
    const avgAtsScore = atsAgg?.avg != null ? Math.round(Number(atsAgg.avg)) : null;

    return {
      totalResumes,
      avgAtsScore,
      jobMatchesCompleted,
      aiEnhancementsUsed,
      resumeViews: Number(resumeViews?.total ?? 0),
      exportCount,
      trends: {
        resumes: this.pctTrend(resumesLast30, resumesPrev30),
        atsScore: this.pctTrend(
          atsLast30?.avg != null ? Number(atsLast30.avg) : 0,
          atsPrev30?.avg != null ? Number(atsPrev30.avg) : 0,
        ),
        jobMatches: this.pctTrend(matchesLast30, matchesPrev30),
        aiUsage: this.pctTrend(
          Number(aiLast30?.total ?? 0),
          Number(aiPrev30?.total ?? 0),
        ),
        views: this.pctTrend(Number(viewsLast30?.total ?? 0), Number(viewsPrev30?.total ?? 0)),
        exports: this.pctTrend(exportsLast30, exportsPrev30),
      },
    };
  }

  async logExport(userId: string, cvId: string, format: 'pdf' | 'docx' | 'html'): Promise<void> {
    await this.exportRepo.save(
      this.exportRepo.create({ userId, cvId, format }),
    );
  }

  async getLatestAtsByCv(userId: string): Promise<Record<string, number>> {
    const rows = await this.atsRepo
      .createQueryBuilder('m')
      .distinctOn(['m.cvId'])
      .where('m.userId = :userId', { userId })
      .orderBy('m.cvId')
      .addOrderBy('m.createdAt', 'DESC')
      .getMany();

    const map: Record<string, number> = {};
    for (const row of rows) {
      map[row.cvId] = row.score;
    }
    return map;
  }

  private pctTrend(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  }
}
