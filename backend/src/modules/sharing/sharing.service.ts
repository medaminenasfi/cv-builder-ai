import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { CVsService } from '../cvs/cvs.service';

const links = new Map<string, { cvId: string; expiresAt: number }>();

@Injectable()
export class SharingService {
  constructor(private readonly cvsService: CVsService) {}

  async createLink(cvId: string, userId: string) {
    await this.cvsService.findById(cvId, userId);
    const token = randomBytes(24).toString('hex');
    links.set(token, { cvId, expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 });
    return { token, url: `/cv/share/${token}`, expiresInDays: 7 };
  }

  async getByToken(token: string) {
    const link = links.get(token);
    if (!link || link.expiresAt < Date.now()) {
      return null;
    }
    const version = await this.cvsService.getLatestVersion(link.cvId);
    return { cvId: link.cvId, data: version?.data ?? {} };
  }
}
