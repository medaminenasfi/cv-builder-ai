import { Injectable } from '@nestjs/common';
import { CVsService } from '../cvs/cvs.service';

@Injectable()
export class JobsService {
  constructor(private readonly cvsService: CVsService) {}

  async match(cvId: string, userId: string, jobDescription: string) {
    await this.cvsService.findById(cvId, userId);
    const version = await this.cvsService.getLatestVersion(cvId);
    const skills = ((version?.data as { skills?: { name: string }[] })?.skills ?? []).map(
      (s) => s.name.toLowerCase(),
    );
    const keywords = jobDescription
      .toLowerCase()
      .match(/\b[a-z]{3,}\b/g)
      ?.slice(0, 30) ?? [];
    const matched = keywords.filter((k) => skills.some((s) => s.includes(k) || k.includes(s)));
    const score = Math.min(100, Math.round((matched.length / Math.max(keywords.length, 1)) * 100));

    return {
      score,
      breakdown: {
        keywords: { matched: matched.length, total: keywords.length },
        format: 85,
        sections: 90,
      },
      gaps: keywords.filter((k) => !matched.includes(k)).slice(0, 10),
      matchedSkills: matched,
    };
  }

  coverLetter(cvId: string, userId: string, jobDescription: string) {
    return {
      content: `Dear Hiring Manager,\n\nI am excited to apply for this role. My experience aligns with your requirements.\n\nJob context: ${jobDescription.slice(0, 200)}...\n\nSincerely,\n[Your Name]`,
    };
  }

  interviewQuestions(cvId: string, userId: string, jobDescription: string) {
    return {
      questions: [
        { q: 'Tell me about a project relevant to this role.', hint: 'Use STAR method' },
        { q: 'How do you handle tight deadlines?', hint: 'Give a concrete example' },
        { q: 'Why this company?', hint: 'Research the company mission' },
        { q: 'Describe a technical challenge you solved.', hint: 'Focus on impact' },
        { q: 'Where do you see yourself in 3 years?', hint: 'Align with the role' },
      ],
    };
  }
}
