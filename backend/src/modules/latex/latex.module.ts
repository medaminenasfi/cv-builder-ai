import { Module } from '@nestjs/common';
import { LatexCompileClient } from './latex-compile.client';

@Module({
  providers: [LatexCompileClient],
  exports: [LatexCompileClient],
})
export class LatexModule {}
