import {
  BadRequestException,
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
    );
  }
}
