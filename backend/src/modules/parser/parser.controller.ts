import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/auth.guards';
import { UserEntity } from '../users/entities/user.entity';
import { ParserService } from './parser.service';
import { ParserQueueService } from './parser-queue.service';

@ApiTags('parser')
@Controller('cvs/import')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ParserController {
  constructor(
    private readonly parserService: ParserService,
    private readonly parserQueueService: ParserQueueService,
  ) {}

  @Post()
  import(
    @Body() body: { title: string; rawText: string },
    @CurrentUser() user: UserEntity,
  ) {
    return this.parserService.importFromText(user, body.title, body.rawText);
  }

  @Post('file')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  importFile(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() body: { title?: string },
    @CurrentUser() user: UserEntity,
  ) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Upload a PDF or DOCX file');
    }
    const title =
      body.title?.trim() ||
      file.originalname.replace(/\.(pdf|docx)$/i, '') ||
      'Imported Resume';
    return this.parserService.importFromFile(
      user,
      title,
      file.buffer,
      file.mimetype,
      file.originalname,
    );
  }

  @Post('file/async')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  importFileAsync(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() body: { title?: string },
    @CurrentUser() user: UserEntity,
  ) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Upload a PDF or DOCX file');
    }
    return this.parserQueueService.enqueueFileJob(
      user,
      file.buffer,
      file.mimetype,
      file.originalname,
      body.title,
    );
  }

  @Get('jobs/:jobId')
  getParseJob(@Param('jobId') jobId: string, @CurrentUser() user: UserEntity) {
    return this.parserQueueService.getJob(jobId, user.id);
  }
}
