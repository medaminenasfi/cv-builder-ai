import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../users/entities/user.entity';
import { renderLatex } from '../../template-engine/latex/render-latex';
import { LatexCompileClient } from '../latex/latex-compile.client';
import { CreateTemplateDto, UpdateTemplateDto } from './dto/template.dto';
import { TemplateEngine, TemplateEntity } from './entities/template.entity';

@Injectable()
export class TemplatesService {
  constructor(
    @InjectRepository(TemplateEntity)
    private readonly templatesRepository: Repository<TemplateEntity>,
    private readonly latexCompileClient: LatexCompileClient,
  ) {}

  findActive(): Promise<TemplateEntity[]> {
    return this.templatesRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  findAll(): Promise<TemplateEntity[]> {
    return this.templatesRepository.find({ order: { createdAt: 'DESC' } });
  }

  findById(id: string): Promise<TemplateEntity | null> {
    return this.templatesRepository.findOne({ where: { id } });
  }

  async create(dto: CreateTemplateDto, user: UserEntity): Promise<TemplateEntity> {
    const slug = dto.slug ?? dto.name.toLowerCase().replace(/\s+/g, '-');
    const exists = await this.templatesRepository.findOne({ where: { slug } });
    if (exists) throw new ConflictException('Template slug already exists');

    const template = this.templatesRepository.create({
      ...dto,
      slug,
      engine: dto.engine ?? TemplateEngine.LATEX,
      createdBy: user.id,
    });
    return this.templatesRepository.save(template);
  }

  async update(id: string, dto: UpdateTemplateDto): Promise<TemplateEntity> {
    const template = await this.findById(id);
    if (!template) throw new NotFoundException('Template not found');
    Object.assign(template, dto);
    return this.templatesRepository.save(template);
  }

  async toggle(id: string): Promise<TemplateEntity> {
    const template = await this.findById(id);
    if (!template) throw new NotFoundException('Template not found');
    template.isActive = !template.isActive;
    return this.templatesRepository.save(template);
  }

  async remove(id: string): Promise<void> {
    const template = await this.findById(id);
    if (!template) throw new NotFoundException('Template not found');
    await this.templatesRepository.remove(template);
  }

  async previewPdf(template: TemplateEntity, rtl = false): Promise<Buffer> {
    const tex = renderLatex(template.latexSource ?? '', undefined, {
      direction: rtl ? 'rtl' : 'ltr',
    });
    const { pdf } = await this.latexCompileClient.compile(tex);
    return pdf;
  }

  async compileTex(tex: string): Promise<Buffer> {
    const { pdf } = await this.latexCompileClient.compile(tex);
    return pdf;
  }
}
