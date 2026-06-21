import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Repository } from 'typeorm';
import { UserEntity } from '../users/entities/user.entity';
import { ParseJobEntity } from './entities/parse-job.entity';
import { ParseJobStatus } from './parse-job.types';

export const PARSE_QUEUE = 'cv-parse';

export interface ParseQueuePayload {
  jobId: string;
  userId: string;
  cvId?: string;
  title?: string;
  mimeType: string;
  fileBase64: string;
  fileName: string;
}

@Injectable()
export class ParserQueueService {
  constructor(
    @InjectQueue(PARSE_QUEUE) private readonly parseQueue: Queue,
    @InjectRepository(ParseJobEntity)
    private readonly parseJobsRepository: Repository<ParseJobEntity>,
  ) {}

  async enqueueFileJob(
    user: UserEntity,
    buffer: Buffer,
    mimeType: string,
    fileName: string,
    title?: string,
    cvId?: string,
  ) {
    const job = await this.parseJobsRepository.save(
      this.parseJobsRepository.create({
        userId: user.id,
        cvId: cvId ?? null,
        status: ParseJobStatus.PENDING,
        fileName,
        mimeType,
      }),
    );

    await this.parseQueue.add('parse-file', {
      jobId: job.id,
      userId: user.id,
      cvId,
      title,
      mimeType,
      fileBase64: buffer.toString('base64'),
      fileName,
    } satisfies ParseQueuePayload);

    return { jobId: job.id, status: ParseJobStatus.PENDING };
  }

  async getJob(jobId: string, userId: string) {
    const job = await this.parseJobsRepository.findOne({ where: { id: jobId, userId } });
    if (!job) throw new NotFoundException('Parse job not found');
    return job;
  }
}
