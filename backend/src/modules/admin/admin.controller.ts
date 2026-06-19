import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user.enum';
import { JwtAuthGuard, RolesGuard } from '../../common/guards/auth.guards';

@ApiTags('admin')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  @Get('ping')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin-only health check' })
  ping() {
    return { message: 'Admin access granted' };
  }
}
