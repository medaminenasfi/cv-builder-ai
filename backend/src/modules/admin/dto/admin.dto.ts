import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { UserLocale, UserPlan, UserRole } from '../../../common/enums/user.enum';

export class BootstrapAdminDto {
  @ApiProperty({ example: 'admin@resumeai.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'AdminPass123!', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'your-secret-from-env' })
  @IsString()
  setupSecret: string;

  @ApiPropertyOptional({ enum: UserLocale })
  @IsOptional()
  @IsEnum(UserLocale)
  locale?: UserLocale;
}

export class UpdateUserPlanDto {
  @ApiProperty({ enum: UserPlan })
  @IsEnum(UserPlan)
  plan: UserPlan;
}

export class UpdateUserRoleDto {
  @ApiProperty({ enum: UserRole })
  @IsEnum(UserRole)
  role: UserRole;
}

export class UpdateUserBlockDto {
  @ApiProperty()
  @IsBoolean()
  isBlocked: boolean;
}
