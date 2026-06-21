import { Injectable } from '@nestjs/common';
import {
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from 'docx';
import { normalizeCVData, type CVData } from '../../common/cv-schema';

@Injectable()
export class DocxExportService {
  async buildDocxBuffer(data: CVData, locale: 'en' | 'fr' | 'ar' = 'en'): Promise<Buffer> {
    const cv = normalizeCVData(data, locale);
    const children: Paragraph[] = [];

    const addHeading = (text: string) => {
      children.push(new Paragraph({ text, heading: HeadingLevel.HEADING_1, spacing: { after: 120 } }));
    };
    const addLine = (text: string) => {
      children.push(new Paragraph({ children: [new TextRun(text)], spacing: { after: 80 } }));
    };

    addHeading(cv.personal.fullName || 'Resume');
    if (cv.personal.title) addLine(cv.personal.title);
    const contact = [cv.personal.email, cv.personal.phone, cv.personal.location]
      .filter(Boolean)
      .join(' · ');
    if (contact) addLine(contact);

    if (cv.summary?.trim()) {
      addHeading('Summary');
      addLine(cv.summary.trim());
    }

    if (cv.experience.length) {
      addHeading('Experience');
      for (const exp of cv.experience) {
        addLine(`${exp.role} — ${exp.company} (${exp.startDate} – ${exp.endDate})`);
        for (const b of exp.bullets) addLine(`• ${b}`);
      }
    }

    if (cv.education.length) {
      addHeading('Education');
      for (const edu of cv.education) {
        addLine(`${edu.degree} — ${edu.institution} (${edu.startDate} – ${edu.endDate})`);
      }
    }

    if (cv.skills.length) {
      addHeading('Skills');
      addLine(cv.skills.map((s) => s.name).join(', '));
    }

    if (cv.languages.length) {
      addHeading('Languages');
      addLine(cv.languages.map((l) => (l.level ? `${l.name} (${l.level})` : l.name)).join(', '));
    }

    if (cv.technologies.length) {
      addHeading('Technologies');
      addLine(cv.technologies.map((t) => t.name).join(', '));
    }

    if (cv.certifications?.length) {
      addHeading('Certifications');
      for (const c of cv.certifications) {
        addLine([c.name, c.issuer, c.date].filter(Boolean).join(' — '));
      }
    }

    if (cv.projects?.length) {
      addHeading('Projects');
      for (const p of cv.projects) {
        addLine(p.name + (p.description ? ` — ${p.description}` : ''));
        for (const b of p.bullets ?? []) addLine(`• ${b}`);
      }
    }

    const doc = new Document({ sections: [{ children }] });
    return Packer.toBuffer(doc);
  }
}
