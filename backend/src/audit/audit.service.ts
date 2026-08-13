import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async logChange(params: {
    userId?: string;
    action: string; // 'CREATE' | 'UPDATE' | 'DELETE' | 'OVERRIDE'
    entityName: string;
    entityId: string;
    beforeState?: any;
    afterState?: any;
  }) {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: params.userId || null,
          action: params.action,
          entityName: params.entityName,
          entityId: params.entityId,
          beforeStateJson: params.beforeState ? JSON.stringify(params.beforeState) : null,
          afterStateJson: params.afterState ? JSON.stringify(params.afterState) : null,
        },
      });
    } catch (error) {
      console.error('Failed to log audit entry:', error);
    }
  }
}
