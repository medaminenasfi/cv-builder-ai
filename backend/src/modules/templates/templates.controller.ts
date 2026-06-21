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
  UseGuards,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
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
  ) {}

  @Post('import')
  @ApiOperation({ summary: 'Import template from PDF or image via AI vision' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async importFromFile(@UploadedFile() file?: Express.Multer.File) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Upload a PDF, PNG, or JPEG file');
    }
    return this.templateImportService.extractTemplateConfigFromFile(
      file.buffer,
      file.mimetype,
    );
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
