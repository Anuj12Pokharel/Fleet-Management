import { Module } from '@nestjs/common';
import { PartsController } from './parts.controller';
import { PartsService } from './parts.service';
import { PrismaService } from '../prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';

@Module({
  controllers: [PartsController],
  providers: [PartsService, PrismaService, AuditService, NotificationsService],
  exports: [PartsService],
})
export class PartsModule {}
