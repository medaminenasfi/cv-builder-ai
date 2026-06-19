import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TemplateEntity } from './entities/template.entity';
import {
  AdminTemplatesController,
  TemplatesController,
} from './templates.controller';
import { TemplatesService } from './templates.service';

@Module({
  imports: [TypeOrmModule.forFeature([TemplateEntity])],
  controllers: [TemplatesController, AdminTemplatesController],
  providers: [TemplatesService],
  exports: [TemplatesService, TypeOrmModule],
})
export class TemplatesModule {}
