import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiUsageController } from './ai-usage.controller';
import { AiUsageService } from './ai-usage.service';
import { AiUsageEntity } from './entities/ai-usage.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AiUsageEntity])],
  controllers: [AiUsageController],
  providers: [AiUsageService],
  exports: [AiUsageService],
})
export class UsageModule {}
