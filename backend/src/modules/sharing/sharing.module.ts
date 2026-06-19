import { Module } from '@nestjs/common';
import { CVsModule } from '../cvs/cvs.module';
import { SharingController } from './sharing.controller';
import { SharingService } from './sharing.service';

@Module({
  imports: [CVsModule],
  controllers: [SharingController],
  providers: [SharingService],
})
export class SharingModule {}
