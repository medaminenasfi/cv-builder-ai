import { Injectable } from '@nestjs/common';
import { CVsService } from '../cvs/cvs.service';
import { UserEntity } from '../users/entities/user.entity';
import { CVVersionSource } from '../cvs/entities/cv-version.entity';
import { emptyCVData } from '../../common/cv-schema';

@Injectable()
export class ParserService {
  constructor(private readonly cvsService: CVsService) {}

  async importFromText(
    user: UserEntity,
    title: string,
    rawText: string,
  ) {
    const cv = await this.cvsService.create({ title }, user);
    const data = emptyCVData(user.locale as 'en');
    data.personal.email = user.email;
    data.summary = rawText.slice(0, 500);
    data.experience = [
      {
        id: '1',
        company: 'Imported',
        role: 'Review and edit',
        startDate: '2020-01',
        endDate: 'present',
        bullets: [rawText.slice(0, 200)],
      },
    ];
    await this.cvsService.updateData(cv.id, user.id, { data: data as unknown as Record<string, unknown> });
    return { cvId: cv.id, message: 'Import complete — review and edit your data' };
  }
}
