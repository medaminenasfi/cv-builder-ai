import { Global, Module } from '@nestjs/common';
import { FilesController } from './files.controller';
import { LocalStorageService } from './local-storage.service';

@Global()
@Module({
  controllers: [FilesController],
  providers: [LocalStorageService],
  exports: [LocalStorageService],
})
export class StorageModule {}
