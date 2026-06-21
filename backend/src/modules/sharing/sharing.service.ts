import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'crypto';
import { Repository } from 'typeorm';
import { CVsService } from '../cvs/cvs.service';
import { ShareLinkEntity } from './entities/share-link.entity';

@Injectable()
export class SharingService {
  constructor(
    private readonly cvsService: CVsService,
    @InjectRepository(ShareLinkEntity)
    private readonly shareLinksRepository: Repository<ShareLinkEntity>,
  ) {}

  async createLink(cvId: string, userId: string) {
    await this.cvsService.findById(cvId, userId);
    const token = randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.shareLinksRepository.save(
      this.shareLinksRepository.create({ token, cvId, expiresAt }),
    );
    return { token, url: `/cv/share/${token}`, expiresInDays: 7 };
  }

  async getByToken(token: string) {
    const link = await this.shareLinksRepository.findOne({ where: { token } });
    if (!link || link.expiresAt.getTime() < Date.now()) {
      return null;
    }
    const version = await this.cvsService.getLatestVersion(link.cvId);
    return { cvId: link.cvId, data: version?.data ?? {} };
  }
}
