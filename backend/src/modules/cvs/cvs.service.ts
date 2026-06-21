import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { emptyCVData, FREE_CV_LIMIT, normalizeCVData } from '../../common/cv-schema';
import { UserPlan } from '../../common/enums/user.enum';
import { UserEntity } from '../users/entities/user.entity';
import { CreateCVDto, UpdateCVDataDto, UpdateCVDto } from './dto/cv.dto';
import { CVVersionEntity, CVVersionSource } from './entities/cv-version.entity';
import { CVEntity } from './entities/cv.entity';

@Injectable()
export class CVsService {
  private static readonly MAX_VERSIONS = 20;

  constructor(
    @InjectRepository(CVEntity)
    private readonly cvsRepository: Repository<CVEntity>,
    @InjectRepository(CVVersionEntity)
    private readonly versionsRepository: Repository<CVVersionEntity>,
  ) {}

  async findAllByUser(userId: string): Promise<CVEntity[]> {
    return this.cvsRepository.find({
      where: { userId },
      order: { updatedAt: 'DESC' },
    });
  }

  async findById(id: string, userId: string): Promise<CVEntity> {
    const cv = await this.cvsRepository.findOne({ where: { id, userId } });
    if (!cv) throw new NotFoundException('CV not found');
    return cv;
  }

  async findByIdWithData(
    id: string,
    userId: string,
  ): Promise<CVEntity & { data: Record<string, unknown> }> {
    const cv = await this.findById(id, userId);
    const version = await this.getLatestVersion(id);
    const locale = (cv.locale ?? 'en') as 'en' | 'fr' | 'ar';
    const raw = version?.data ?? (emptyCVData(locale) as unknown as Record<string, unknown>);
    return {
      ...cv,
      data: normalizeCVData(raw, locale) as unknown as Record<string, unknown>,
    };
  }

  async create(dto: CreateCVDto, user: UserEntity): Promise<CVEntity> {
    const count = await this.cvsRepository.count({ where: { userId: user.id } });
    if (user.plan === UserPlan.FREE && count >= FREE_CV_LIMIT) {
      throw new ForbiddenException(
        `Free plan allows maximum ${FREE_CV_LIMIT} CVs. Upgrade to Pro for unlimited.`,
      );
    }

    const cv = await this.cvsRepository.save(
      this.cvsRepository.create({
        userId: user.id,
        title: dto.title,
        templateId: dto.templateId ?? null,
        locale: dto.locale ?? user.locale,
        jobTitleTarget: dto.jobTitleTarget ?? null,
      }),
    );

    await this.createVersion(
      cv.id,
      emptyCVData((dto.locale ?? user.locale) as 'en') as unknown as Record<string, unknown>,
      CVVersionSource.MANUAL,
    );
    return cv;
  }

  async update(id: string, userId: string, dto: UpdateCVDto): Promise<CVEntity> {
    const cv = await this.findById(id, userId);
    Object.assign(cv, dto);
    return this.cvsRepository.save(cv);
  }

  async updateData(
    id: string,
    userId: string,
    dto: UpdateCVDataDto,
    source: CVVersionSource = CVVersionSource.MANUAL,
  ): Promise<CVVersionEntity> {
    const cv = await this.findById(id, userId);
    cv.updatedAt = new Date();
    await this.cvsRepository.save(cv);
    return this.createVersion(id, dto.data, source);
  }

  async duplicate(id: string, user: UserEntity): Promise<CVEntity> {
    const original = await this.findById(id, user.id);
    const count = await this.cvsRepository.count({ where: { userId: user.id } });
    if (user.plan === UserPlan.FREE && count >= FREE_CV_LIMIT) {
      throw new ForbiddenException(`Free plan allows maximum ${FREE_CV_LIMIT} CVs`);
    }

    const copy = await this.cvsRepository.save(
      this.cvsRepository.create({
        userId: user.id,
        title: `${original.title} (Copy)`,
        templateId: original.templateId,
        locale: original.locale,
        jobTitleTarget: original.jobTitleTarget,
      }),
    );

    const latest = await this.getLatestVersion(original.id);
    if (latest) {
      await this.createVersion(copy.id, latest.data, CVVersionSource.MANUAL);
    }
    return copy;
  }

  async remove(id: string, userId: string): Promise<void> {
    const cv = await this.findById(id, userId);
    await this.cvsRepository.remove(cv);
  }

  async getVersions(cvId: string, userId: string): Promise<CVVersionEntity[]> {
    await this.findById(cvId, userId);
    return this.versionsRepository.find({
      where: { cvId },
      order: { versionNumber: 'DESC' },
    });
  }

  async getLatestVersion(cvId: string): Promise<CVVersionEntity | null> {
    return this.versionsRepository.findOne({
      where: { cvId },
      order: { versionNumber: 'DESC' },
    });
  }

  private async createVersion(
    cvId: string,
    data: Record<string, unknown>,
    source: CVVersionSource,
  ): Promise<CVVersionEntity> {
    const latest = await this.getLatestVersion(cvId);
    const versionNumber = (latest?.versionNumber ?? 0) + 1;
    const saved = await this.versionsRepository.save(
      this.versionsRepository.create({ cvId, data, source, versionNumber }),
    );
    await this.trimVersions(cvId);
    return saved;
  }

  private async trimVersions(cvId: string): Promise<void> {
    const versions = await this.versionsRepository.find({
      where: { cvId },
      order: { versionNumber: 'DESC' },
    });
    if (versions.length <= CVsService.MAX_VERSIONS) return;
    await this.versionsRepository.remove(versions.slice(CVsService.MAX_VERSIONS));
  }
}
