import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/auth.guards';
import { UserEntity } from '../users/entities/user.entity';
import { JobsService } from './jobs.service';

@ApiTags('jobs')
@Controller('cvs')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post(':id/jobs/match')
  match(
    @Param('id') id: string,
    @Body() body: { jobDescription: string },
    @CurrentUser() user: UserEntity,
  ) {
    return this.jobsService.match(id, user.id, body.jobDescription);
  }

  @Post(':id/jobs/cover-letter')
  coverLetter(
    @Param('id') id: string,
    @Body() body: { jobDescription: string },
    @CurrentUser() user: UserEntity,
  ) {
    return this.jobsService.coverLetter(id, user.id, body.jobDescription);
  }

  @Post(':id/jobs/interview-questions')
  interview(
    @Param('id') id: string,
    @Body() body: { jobDescription: string },
    @CurrentUser() user: UserEntity,
  ) {
    return this.jobsService.interviewQuestions(id, user.id, body.jobDescription);
  }
}
