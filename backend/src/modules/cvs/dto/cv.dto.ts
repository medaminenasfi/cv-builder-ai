import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateCVDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  templateId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  locale?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  jobTitleTarget?: string;
}

export class UpdateCVDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  templateId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  jobTitleTarget?: string;
}

export class UpdateCVDataDto {
  @ApiProperty()
  @IsObject()
  data: Record<string, unknown>;
}
