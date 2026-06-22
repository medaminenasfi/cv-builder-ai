import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user.enum';
import { JwtAuthGuard, RolesGuard } from '../../common/guards/auth.guards';
import { UserEntity } from '../users/entities/user.entity';
import { renderLatex } from '../../template-engine/latex/render-latex';
import {
  CompileLatexDto,
  CreateTemplateDto,
  UpdateTemplateDto,
} from './dto/template.dto';
import { TemplatesService } from './templates.service';
import { BuiltinTemplatesService } from './builtin-templates.service';

@ApiTags('templates')
@Controller('templates')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Get()
  @ApiOperation({ summary: 'List active templates (users)' })
  findActive() {
    return this.templatesService.findActive();
  }

  @Get(':id/preview.pdf')
  @ApiOperation({ summary: 'Preview an active template with sample CV data (PDF)' })
  async previewPdf(
    @Param('id') id: string,
    @Query('rtl') rtl: string | undefined,
    @Res() res: Response,
  ) {
    const template = await this.templatesService.findById(id);
    if (!template?.isActive) {
      throw new NotFoundException('Template not found');
    }
    const pdf = await this.templatesService.previewPdf(template, rtl === 'true');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="template-preview.pdf"');
    res.send(pdf);
  }
}

@ApiTags('admin')
@ApiBearerAuth()
@Controller('admin/templates')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminTemplatesController {
  constructor(
    private readonly templatesService: TemplatesService,
    private readonly builtinTemplatesService: BuiltinTemplatesService,
  ) {}

  @Get('bundled')
  listBundled() {
    return this.builtinTemplatesService.listBundled();
  }

  @Post('bundled/:slug/load')
  loadBundled(@Param('slug') slug: string) {
    return this.builtinTemplatesService.loadBundled(slug);
  }

  @Post('latex/compile')
  @ApiOperation({ summary: 'Compile pasted LaTeX without saving (sandbox test)' })
  async compileLatex(@Body() dto: CompileLatexDto, @Res() res: Response) {
    const tex = renderLatex(dto.tex);
    const pdf = await this.templatesService.compileTex(tex);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="compile-test.pdf"');
    res.send(pdf);
  }

  @Get()
  findAll() {
    return this.templatesService.findAll();
  }

  @Post()
  create(@Body() dto: CreateTemplateDto, @CurrentUser() user: UserEntity) {
    return this.templatesService.create(dto, user);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTemplateDto) {
    return this.templatesService.update(id, dto);
  }

  @Patch(':id/toggle')
  toggle(@Param('id') id: string) {
    return this.templatesService.toggle(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.templatesService.remove(id);
  }

  @Get(':id/preview.pdf')
  async previewPdf(
    @Param('id') id: string,
    @Query('rtl') rtl: string | undefined,
    @Res() res: Response,
  ) {
    const template = await this.templatesService.findById(id);
    if (!template) throw new NotFoundException('Template not found');
    const pdf = await this.templatesService.previewPdf(template, rtl === 'true');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="template-preview.pdf"');
    res.send(pdf);
  }
}
