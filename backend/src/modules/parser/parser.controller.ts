import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/auth.guards';
import { UserEntity } from '../users/entities/user.entity';
import { ParserService } from './parser.service';

@ApiTags('parser')
@Controller('cvs/import')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ParserController {
  constructor(private readonly parserService: ParserService) {}

  @Post()
  import(
    @Body() body: { title: string; rawText: string },
    @CurrentUser() user: UserEntity,
  ) {
    return this.parserService.importFromText(user, body.title, body.rawText);
  }
}
