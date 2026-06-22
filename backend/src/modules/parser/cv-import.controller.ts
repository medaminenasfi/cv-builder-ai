import {
  BadRequestException,
  Body,
  Controller,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/auth.guards';
import { UserEntity } from '../users/entities/user.entity';
import { ParserService } from './parser.service';

@ApiTags('parser')
@Controller('cvs')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CVImportController {
  constructor(private readonly parserService: ParserService) {}

  @Post(':id/import/file')
  @ApiOperation({ summary: 'Import PDF/DOCX into an existing CV (replaces content)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  importIntoExisting(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentUser() user: UserEntity,
  ) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Upload a PDF or DOCX file');
    }
    return this.parserService.importFileIntoExisting(
      id,
      user,
      file.buffer,
      file.mimetype,
      file.originalname,
    );
  }

  @Post(':id/import/json')
  @ApiOperation({ summary: 'Import structured JSON into an existing CV (no AI)' })
  importJsonIntoExisting(
    @Param('id') id: string,
    @Body() body: { data: unknown },
    @CurrentUser() user: UserEntity,
  ) {
    if (!body?.data || typeof body.data !== 'object') {
      throw new BadRequestException('Request body must include a data object');
    }
    return this.parserService.importJsonIntoExisting(id, user, body.data);
  }

  @Post(':id/import/json/file')
  @ApiOperation({ summary: 'Import a .json CV file into an existing CV (no AI)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 2 * 1024 * 1024 },
    }),
  )
  importJsonFileIntoExisting(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentUser() user: UserEntity,
  ) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Upload a .json CV file');
    }
    return this.parserService.importJsonFileIntoExisting(id, user, file.buffer);
  }
}
