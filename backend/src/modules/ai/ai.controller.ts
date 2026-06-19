import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/auth.guards';
import { UserEntity } from '../users/entities/user.entity';
import { AIService } from './ai.service';

@ApiTags('ai')
@Controller('cvs')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AIController {
  constructor(private readonly aiService: AIService) {}

  @Post(':id/enhance')
  enhance(
    @Param('id') id: string,
    @Body() body: { sections: string[]; tone: string },
    @CurrentUser() user: UserEntity,
  ) {
    return this.aiService.enhance(id, user.id, body.sections, body.tone);
  }

  @Post(':id/enhance/apply')
  apply(
    @Param('id') id: string,
    @Body() body: { data: Record<string, unknown> },
    @CurrentUser() user: UserEntity,
  ) {
    return this.aiService.applyEnhancement(id, user.id, body.data);
  }
}
