import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CVEntity } from '../cvs/entities/cv.entity';
import { TemplateEntity } from '../templates/entities/template.entity';
import { UserEntity } from './entities/user.entity';
import { UsersService } from './users.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, CVEntity, TemplateEntity])],
  providers: [UsersService],
  exports: [UsersService, TypeOrmModule],
})
export class UsersModule {}
