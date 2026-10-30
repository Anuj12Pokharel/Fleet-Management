import { Module } from '@nestjs/common';
import { BrakesController } from './brakes.controller';
import { BrakesService } from './brakes.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [BrakesController],
  providers: [BrakesService, PrismaService],
  exports: [BrakesService],
})
export class BrakesModule {}
