import { Controller, Get, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../enums';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/audit-logs')
export class AuditController {
  constructor(private prisma: PrismaService) {}

  @Roles(Role.MAINTENANCE_ADMIN, Role.FLEET_MANAGER)
  @Get()
  async getAuditLogs() {
    const list = await this.prisma.auditLog.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: { timestamp: 'desc' },
    });
    return list.map(item => ({
      ...item,
      beforeStateJson: item.beforeStateJson ? JSON.parse(item.beforeStateJson) : null,
      afterStateJson: item.afterStateJson ? JSON.parse(item.afterStateJson) : null,
    }));
  }
}
