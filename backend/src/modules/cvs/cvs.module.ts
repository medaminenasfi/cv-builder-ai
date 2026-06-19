import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CVsController } from './cvs.controller';
import { CVsService } from './cvs.service';
import { CVVersionEntity } from './entities/cv-version.entity';
import { CVEntity } from './entities/cv.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CVEntity, CVVersionEntity])],
  controllers: [CVsController],
  providers: [CVsService],
  exports: [CVsService, TypeOrmModule],
})
export class CVsModule {}
