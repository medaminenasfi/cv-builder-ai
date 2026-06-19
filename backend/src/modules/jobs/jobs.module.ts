import { Module } from '@nestjs/common';
import { CVsModule } from '../cvs/cvs.module';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';

@Module({
  imports: [CVsModule],
  controllers: [JobsController],
  providers: [JobsService],
})
export class JobsModule {}
