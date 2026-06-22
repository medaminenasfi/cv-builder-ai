import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CVsModule } from '../cvs/cvs.module';
import { ExportModule } from '../export/export.module';
import { ShareLinkEntity } from './entities/share-link.entity';
import { SharingController } from './sharing.controller';
import { SharingService } from './sharing.service';

@Module({
  imports: [CVsModule, ExportModule, TypeOrmModule.forFeature([ShareLinkEntity])],
  controllers: [SharingController],
  providers: [SharingService],
})
export class SharingModule {}
