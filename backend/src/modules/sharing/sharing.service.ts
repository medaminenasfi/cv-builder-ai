import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'crypto';
import { Repository } from 'typeorm';
import { CVsService } from '../cvs/cvs.service';
import { ExportService } from '../export/export.service';
import { ShareLinkEntity } from './entities/share-link.entity';

@Injectable()
export class SharingService {
  constructor(
    private readonly cvsService: CVsService,
    private readonly exportService: ExportService,
    @InjectRepository(ShareLinkEntity)
    private readonly shareLinksRepository: Repository<ShareLinkEntity>,
  ) {}

  async createLink(cvId: string, userId: string, displayName?: string) {
    await this.cvsService.findById(cvId, userId);
    const token = randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.shareLinksRepository.save(
      this.shareLinksRepository.create({
        token,
        cvId,
        expiresAt,
        viewCount: 0,
        displayName: displayName?.trim() || null,
      }),
    );
    return { token, url: `/cv/share/${token}`, expiresInDays: 7 };
  }

  async getByToken(token: string) {
    const link = await this.shareLinksRepository.findOne({ where: { token } });
    if (!link || link.expiresAt.getTime() < Date.now()) {
      return null;
    }

    link.viewCount = (link.viewCount ?? 0) + 1;
    await this.shareLinksRepository.save(link);

    const rendered = await this.exportService.renderPublicSharePdf(link.cvId);
    if (!rendered) return null;

    const version = await this.cvsService.getLatestVersion(link.cvId);
    return {
      cvId: link.cvId,
      title: rendered.title,
      locale: rendered.locale,
      fullName: link.displayName?.trim() || rendered.fullName,
      displayName: link.displayName,
      pdfBase64: rendered.pdf.toString('base64'),
      data: version?.data ?? {},
      expiresAt: link.expiresAt.toISOString(),
    };
  }

  async exportPdfByToken(token: string): Promise<Buffer | null> {
    const link = await this.shareLinksRepository.findOne({ where: { token } });
    if (!link || link.expiresAt.getTime() < Date.now()) {
      return null;
    }
    return this.exportService.exportPublicPdf(link.cvId);
  }
}
