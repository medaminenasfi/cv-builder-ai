import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LatexModule } from '../latex/latex.module';
import { TemplateEntity } from './entities/template.entity';
import {
  AdminTemplatesController,
  TemplatesController,
} from './templates.controller';
import { BuiltinTemplatesService } from './builtin-templates.service';
import { TemplatesService } from './templates.service';

@Module({
  imports: [TypeOrmModule.forFeature([TemplateEntity]), LatexModule],
  controllers: [TemplatesController, AdminTemplatesController],
  providers: [TemplatesService, BuiltinTemplatesService],
  exports: [TemplatesService, TypeOrmModule],
})
export class TemplatesModule {}
