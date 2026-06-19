import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/auth.guards';
import { UserEntity } from '../users/entities/user.entity';
import { CreateCVDto, UpdateCVDataDto, UpdateCVDto } from './dto/cv.dto';
import { CVsService } from './cvs.service';

@ApiTags('cvs')
@Controller('cvs')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CVsController {
  constructor(private readonly cvsService: CVsService) {}

  @Get()
  @ApiOperation({ summary: 'List user CVs' })
  findAll(@CurrentUser() user: UserEntity) {
    return this.cvsService.findAllByUser(user.id);
  }

  @Post()
  create(@Body() dto: CreateCVDto, @CurrentUser() user: UserEntity) {
    return this.cvsService.create(dto, user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: UserEntity) {
    return this.cvsService.findById(id, user.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCVDto,
    @CurrentUser() user: UserEntity,
  ) {
    return this.cvsService.update(id, user.id, dto);
  }

  @Patch(':id/data')
  updateData(
    @Param('id') id: string,
    @Body() dto: UpdateCVDataDto,
    @CurrentUser() user: UserEntity,
  ) {
    return this.cvsService.updateData(id, user.id, dto);
  }

  @Post(':id/duplicate')
  duplicate(@Param('id') id: string, @CurrentUser() user: UserEntity) {
    return this.cvsService.duplicate(id, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: UserEntity) {
    return this.cvsService.remove(id, user.id);
  }

  @Get(':id/versions')
  versions(@Param('id') id: string, @CurrentUser() user: UserEntity) {
    return this.cvsService.getVersions(id, user.id);
  }
}
