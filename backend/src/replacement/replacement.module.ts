import { Module } from '@nestjs/common';
import { ReplacementController } from './replacement.controller';
import { ReplacementService } from './replacement.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [ReplacementController],
  providers: [ReplacementService, PrismaService],
  exports: [ReplacementService],
})
export class ReplacementModule {}
