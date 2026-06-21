import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/auth.guards';
import { UserEntity } from '../users/entities/user.entity';
import { AiUsageService } from './ai-usage.service';

@ApiTags('ai-usage')
@Controller('ai/usage')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AiUsageController {
  constructor(private readonly aiUsageService: AiUsageService) {}

  @Get()
  status(@CurrentUser() user: UserEntity) {
    return this.aiUsageService.getStatus(user.id, user.plan);
  }
}
