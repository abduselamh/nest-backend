// src/common/common.module.ts
import { Module } from '@nestjs/common';
import { JwtService } from './security/security.service';

@Module({
  providers: [JwtService],
  exports: [JwtService],
})
export class CommonModule {}
