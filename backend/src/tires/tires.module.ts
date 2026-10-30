import { Module } from '@nestjs/common';
import { TiresController } from './tires.controller';
import { TiresService } from './tires.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [TiresController],
  providers: [TiresService, PrismaService],
  exports: [TiresService],
})
export class TiresModule {}
