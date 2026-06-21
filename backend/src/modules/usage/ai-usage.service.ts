import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  aiDailyLimitForPlan,
  FREE_AI_DAILY_LIMIT,
  PRO_AI_DAILY_LIMIT,
} from '../../common/ai-quota.constants';
import { UserPlan } from '../../common/enums/user.enum';
import { AiUsageEntity } from './entities/ai-usage.entity';

@Injectable()
export class AiUsageService {
  private readonly logger = new Logger(AiUsageService.name);

  constructor(
    @InjectRepository(AiUsageEntity)
    private readonly usageRepository: Repository<AiUsageEntity>,
  ) {}

  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }

  async assertWithinQuota(userId: string, plan: UserPlan): Promise<void> {
    try {
      const limit = aiDailyLimitForPlan(plan);
      const usageDate = this.today();
      let row = await this.usageRepository.findOne({ where: { userId, usageDate } });
      if (!row) {
        row = await this.usageRepository.save(
          this.usageRepository.create({ userId, usageDate, callCount: 0 }),
        );
      }
      if (row.callCount >= limit) {
        throw new ForbiddenException(
          `Daily AI limit reached (${limit} calls). Upgrade to Pro for ${PRO_AI_DAILY_LIMIT}/day.`,
        );
      }
    } catch (err) {
      if (err instanceof ForbiddenException) throw err;
      this.logger.warn(`AI quota check skipped: ${String(err)}`);
    }
  }

  async recordCall(userId: string): Promise<void> {
    try {
      const usageDate = this.today();
      let row = await this.usageRepository.findOne({ where: { userId, usageDate } });
      if (!row) {
        await this.usageRepository.save(
          this.usageRepository.create({ userId, usageDate, callCount: 1 }),
        );
        return;
      }
      row.callCount += 1;
      await this.usageRepository.save(row);
    } catch (err) {
      this.logger.warn(`AI usage record skipped: ${String(err)}`);
    }
  }

  async getStatus(userId: string, plan: UserPlan) {
    try {
      const usageDate = this.today();
      const row = await this.usageRepository.findOne({ where: { userId, usageDate } });
      const limit = aiDailyLimitForPlan(plan);
      return {
        used: row?.callCount ?? 0,
        limit,
        remaining: Math.max(0, limit - (row?.callCount ?? 0)),
        date: usageDate,
      };
    } catch {
      const limit = aiDailyLimitForPlan(plan);
      return { used: 0, limit, remaining: limit, date: this.today() };
    }
  }
}
