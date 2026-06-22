import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { TemplateEngine } from '../entities/template.entity';

export class CreateTemplateDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiProperty()
  @IsString()
  @MinLength(10)
  latexSource: string;

  @ApiPropertyOptional({ enum: TemplateEngine })
  @IsOptional()
  @IsEnum(TemplateEngine)
  engine?: TemplateEngine;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  supportsRtl?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateTemplateDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  latexSource?: string;

  @ApiPropertyOptional({ enum: TemplateEngine })
  @IsOptional()
  @IsEnum(TemplateEngine)
  engine?: TemplateEngine;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  supportsRtl?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CompileLatexDto {
  @ApiProperty()
  @IsString()
  @MinLength(10)
  tex: string;
}
