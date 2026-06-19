import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { UserLocale, UserPlan, UserRole } from '../../common/enums/user.enum';
import { UsersService } from '../users/users.service';
import { BootstrapAdminDto } from './dto/admin.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  async bootstrap(dto: BootstrapAdminDto) {
    const secret = this.configService.get<string>('ADMIN_SETUP_SECRET');
    if (!secret || dto.setupSecret !== secret) {
      throw new UnauthorizedException('Invalid setup secret');
    }

    const adminExists = await this.usersService.adminExists();
    if (adminExists) {
      throw new ForbiddenException('Admin already exists');
    }

    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ForbiddenException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.usersService.create({
      email: dto.email.toLowerCase(),
      passwordHash,
      role: UserRole.ADMIN,
      plan: UserPlan.PRO,
      locale: dto.locale ?? UserLocale.EN,
    });

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      message: 'Admin created successfully. Login with this account.',
    };
  }

  async getStats() {
    const [totalUsers, totalAdmins, totalCvs, activeTemplates] =
      await Promise.all([
        this.usersService.count(),
        this.usersService.countByRole(UserRole.ADMIN),
        this.usersService.countCvs(),
        this.usersService.countActiveTemplates(),
      ]);

    return {
      totalUsers,
      totalAdmins,
      totalCvs,
      activeTemplates,
      timestamp: new Date().toISOString(),
    };
  }
}
