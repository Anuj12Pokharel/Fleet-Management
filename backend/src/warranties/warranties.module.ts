import { Module } from '@nestjs/common';
import { WarrantiesController } from './warranties.controller';
import { WarrantiesService } from './warranties.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [WarrantiesController],
  providers: [WarrantiesService, PrismaService],
  exports: [WarrantiesService],
})
export class WarrantiesModule {}
