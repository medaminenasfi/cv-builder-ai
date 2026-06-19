import { ApiProperty } from '@nestjs/swagger';
import { UserLocale, UserPlan, UserRole } from '../../../common/enums/user.enum';

export class UserResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ enum: UserRole })
  role: UserRole;

  @ApiProperty({ enum: UserPlan })
  plan: UserPlan;

  @ApiProperty({ enum: UserLocale })
  locale: UserLocale;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class AuthResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  refreshToken: string;

  @ApiProperty({ type: UserResponseDto })
  user: UserResponseDto;
}
