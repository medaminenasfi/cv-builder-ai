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
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user.enum';
import { JwtAuthGuard, RolesGuard } from '../../common/guards/auth.guards';
import { UserEntity } from '../users/entities/user.entity';
import { CreateTemplateDto, UpdateTemplateDto } from './dto/template.dto';
import { TemplatesService } from './templates.service';
import { TemplateImportService } from './template-import.service';
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

  @Get(':id/preview')
  @ApiOperation({ summary: 'Preview an active template with sample CV data' })
  async preview(@Param('id') id: string, @Query('rtl') rtl?: string) {
    const template = await this.templatesService.findById(id);
    if (!template?.isActive) {
      throw new NotFoundException('Template not found');
    }
    return { html: this.templatesService.preview(template, rtl === 'true') };
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
    private readonly templateImportService: TemplateImportService,
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

  @Post('import')
  @ApiOperation({
    summary: 'Import template from PDF/image (AI), or a .json package (no AI)',
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async importFromFile(@UploadedFile() file?: Express.Multer.File) {
    if (!file?.buffer?.length) {
      throw new BadRequestException(
        'Upload a .json package, PDF, PNG, or JPEG file',
      );
    }
    return this.templateImportService.extractTemplateConfigFromFile(
      file.buffer,
      file.mimetype,
      file.originalname,
    );
  }

  @Post('import/json/text')
  @ApiOperation({
    summary: 'Import template from pasted ChatGPT JSON (auto-repairs broken quotes)',
  })
  importFromJsonText(@Body() body: { text?: string }) {
    if (!body?.text?.trim()) {
      throw new BadRequestException('Paste the JSON text from ChatGPT');
    }
    return this.templateImportService.importFromJsonText(body.text);
  }

  @Post('import/json')
  @ApiOperation({ summary: 'Import template design from JSON (htmlStructure + css)' })
  importFromJson(@Body() body: unknown) {
    if (!body || typeof body !== 'object') {
      throw new BadRequestException('Send a JSON object with name, htmlStructure, and css');
    }
    return this.templateImportService.importFromJsonPayload(body);
  }

  @Post('import/package')
  @ApiOperation({ summary: 'Import template from HTML + CSS files (no AI)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'html', maxCount: 1 },
        { name: 'css', maxCount: 1 },
      ],
      {
        storage: memoryStorage(),
        limits: { fileSize: 2 * 1024 * 1024 },
      },
    ),
  )
  async importFromPackage(
    @UploadedFiles()
    files: { html?: Express.Multer.File[]; css?: Express.Multer.File[] },
    @Body('name') name?: string,
  ) {
    const htmlFile = files.html?.[0];
    const cssFile = files.css?.[0];
    if (!htmlFile?.buffer?.length || !cssFile?.buffer?.length) {
      throw new BadRequestException('Upload both an HTML file and a CSS file');
    }
    const derivedName =
      name?.trim() ||
      htmlFile.originalname.replace(/\.html?$/i, '') ||
      'Imported Template';
    return this.templateImportService.importTemplatePackage({
      name: derivedName,
      htmlStructure: htmlFile.buffer.toString('utf8'),
      css: cssFile.buffer.toString('utf8'),
    });
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

  @Get(':id/preview')
  async preview(@Param('id') id: string, @Query('rtl') rtl?: string) {
    const template = await this.templatesService.findById(id);
    if (!template) throw new NotFoundException('Template not found');
    return { html: this.templatesService.preview(template, rtl === 'true') };
  }
}
