import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from 'bullmq';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { ParseJobEntity } from './entities/parse-job.entity';
import { PARSE_QUEUE, ParseQueuePayload } from './parser-queue.service';
import { ParserService } from './parser.service';
import { ParseJobStatus } from './parse-job.types';

@Processor(PARSE_QUEUE)
export class ParserProcessor extends WorkerHost {
  private readonly logger = new Logger(ParserProcessor.name);

  constructor(
    private readonly parserService: ParserService,
    private readonly usersService: UsersService,
    @InjectRepository(ParseJobEntity)
    private readonly parseJobsRepository: Repository<ParseJobEntity>,
  ) {
    super();
  }

  async process(job: Job<ParseQueuePayload>): Promise<void> {
    const { jobId, userId, cvId, title, mimeType, fileBase64, fileName } = job.data;
    await this.parseJobsRepository.update(jobId, { status: ParseJobStatus.PROCESSING });

    try {
      const user = await this.usersService.findById(userId);
      if (!user) throw new Error('User not found');

      const buffer = Buffer.from(fileBase64, 'base64');
      let result: Record<string, unknown>;

      if (cvId) {
        result = await this.parserService.importFileIntoExisting(
          cvId,
          user,
          buffer,
          mimeType,
          fileName,
        );
      } else {
        const importTitle =
          title?.trim() ||
          fileName.replace(/\.(pdf|docx)$/i, '') ||
          'Imported Resume';
        result = await this.parserService.importFromFile(
          user,
          importTitle,
          buffer,
          mimeType,
          fileName,
        );
      }

      const job = await this.parseJobsRepository.findOne({ where: { id: jobId } });
      if (job) {
        job.status = ParseJobStatus.COMPLETED;
        job.result = result;
        job.error = null;
        await this.parseJobsRepository.save(job);
      }
    } catch (err) {
      this.logger.error(`Parse job ${jobId} failed: ${String(err)}`);
      await this.parseJobsRepository.update(jobId, {
        status: ParseJobStatus.FAILED,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
}
