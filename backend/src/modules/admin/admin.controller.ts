import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserPlan, UserRole } from '../../common/enums/user.enum';
import { JwtAuthGuard, RolesGuard } from '../../common/guards/auth.guards';
import { UsersService } from '../users/users.service';
import { AdminService } from './admin.service';
import {
  BootstrapAdminDto,
  UpdateUserBlockDto,
  UpdateUserPlanDto,
  UpdateUserRoleDto,
} from './dto/admin.dto';

@ApiTags('admin')
@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly usersService: UsersService,
  ) {}

  @Post('bootstrap')
  @ApiOperation({ summary: 'Create first admin (once only, requires setup secret)' })
  bootstrap(@Body() dto: BootstrapAdminDto) {
    return this.adminService.bootstrap(dto);
  }

  @Get('ping')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  ping() {
    return { message: 'Admin access granted' };
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  stats() {
    return this.adminService.getStats();
  }

  @Get('users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  listUsers(@Query('page') page = '1', @Query('limit') limit = '20') {
    return this.usersService.findAllPaginated(Number(page), Number(limit));
  }

  @Patch('users/:id/plan')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  updatePlan(@Param('id') id: string, @Body() dto: UpdateUserPlanDto) {
    return this.usersService.updatePlan(id, dto.plan);
  }

  @Patch('users/:id/role')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  updateRole(@Param('id') id: string, @Body() dto: UpdateUserRoleDto) {
    return this.usersService.updateRole(id, dto.role);
  }

  @Patch('users/:id/block')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  updateBlock(@Param('id') id: string, @Body() dto: UpdateUserBlockDto) {
    return this.usersService.updateBlocked(id, dto.isBlocked);
  }
}
