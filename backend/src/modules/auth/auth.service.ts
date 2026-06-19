import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'crypto';
import { Repository } from 'typeorm';
import { UserLocale, UserPlan, UserRole } from '../../common/enums/user.enum';
import { UsersService } from '../users/users.service';
import { UserEntity } from '../users/entities/user.entity';
import { RefreshTokenEntity } from './entities/refresh-token.entity';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { AuthResponseDto, UserResponseDto } from './dto/auth-response.dto';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(RefreshTokenEntity)
    private readonly refreshTokensRepository: Repository<RefreshTokenEntity>,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const existing = await this.usersService.findByEmail(dto.email);

    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.usersService.create({
      email: dto.email.toLowerCase(),
      passwordHash,
      role: UserRole.USER,
      plan: UserPlan.FREE,
      locale: dto.locale ?? UserLocale.EN,
    });

    return this.issueTokens(user);
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.issueTokens(user);
  }

  async refresh(refreshToken: string): Promise<AuthResponseDto> {
    const tokenHash = this.hashToken(refreshToken);
    const storedToken = await this.refreshTokensRepository.findOne({
      where: { tokenHash },
      relations: ['user'],
    });

    if (
      !storedToken ||
      storedToken.revokedAt ||
      storedToken.expiresAt.getTime() < Date.now()
    ) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    storedToken.revokedAt = new Date();
    await this.refreshTokensRepository.save(storedToken);

    return this.issueTokens(storedToken.user);
  }

  async logout(refreshToken: string): Promise<void> {
    if (!refreshToken) {
      return;
    }

    const tokenHash = this.hashToken(refreshToken);
    const storedToken = await this.refreshTokensRepository.findOne({
      where: { tokenHash },
    });

    if (storedToken && !storedToken.revokedAt) {
      storedToken.revokedAt = new Date();
      await this.refreshTokensRepository.save(storedToken);
    }
  }

  getProfile(user: UserEntity): UserResponseDto {
    return this.toUserResponse(user);
  }

  private async issueTokens(user: UserEntity): Promise<AuthResponseDto> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('JWT_SECRET'),
      expiresIn: this.configService.get('JWT_EXPIRES_IN', '15m') as `${number}m`,
    });

    const refreshToken = randomBytes(64).toString('hex');
    const refreshExpiresIn = this.configService.get<string>(
      'JWT_REFRESH_EXPIRES_IN',
      '7d',
    );

    await this.refreshTokensRepository.save(
      this.refreshTokensRepository.create({
        userId: user.id,
        tokenHash: this.hashToken(refreshToken),
        expiresAt: this.addDuration(refreshExpiresIn),
      }),
    );

    return {
      accessToken,
      refreshToken,
      user: this.toUserResponse(user),
    };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private addDuration(duration: string): Date {
    const match = duration.match(/^(\d+)([smhd])$/);

    if (!match) {
      return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }

    const value = Number(match[1]);
    const unit = match[2];
    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    return new Date(Date.now() + value * multipliers[unit]);
  }

  private toUserResponse(user: UserEntity): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      plan: user.plan,
      locale: user.locale,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
