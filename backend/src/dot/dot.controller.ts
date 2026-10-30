import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { PrismaService } from '../prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role, WorkOrderStatus, WorkOrderPriority, WorkOrderType, AssetStatus } from '../enums';
import { NotificationsService } from '../notifications/notifications.service';

@ApiTags('DOT')
@ApiBearerAuth('JWT-Auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/dot')
export class DotController {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List roadside DOT inspections', description: 'Returns Level 1-5 roadside inspections, violation citations, and linked repair work orders.' })
  @ApiResponse({ status: 200, description: 'DOT inspections list.' })
  async getDotInspections() {
    const list = await this.prisma.dOTInspection.findMany({
      include: {
        asset: true,
        workOrders: true,
      },
      orderBy: { inspectionDate: 'desc' },
    });
    return list.map(item => ({
      ...item,
      violationsJson: JSON.parse(item.violationsJson || '[]'),
    }));
  }

  @Roles(Role.MAINTENANCE_ADMIN, Role.FLEET_MANAGER)
  @Post()
  @ApiOperation({ summary: 'Log roadside DOT inspection', description: 'Records official DOT inspection. Violations automatically switch asset to INOPERABLE and auto-generate urgent work order.' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['assetId', 'inspectionDate', 'result', 'violationsJson'],
      properties: {
        assetId: { type: 'string', example: 'asset_123' },
        inspectionDate: { type: 'string', format: 'date-time', example: '2026-10-29T11:00:00Z' },
        result: { type: 'string', enum: ['CLEAN', 'VIOLATION'], example: 'CLEAN' },
        violationsJson: { type: 'array', items: { type: 'string' }, example: ['393.45(a) - Brake tubing chaffing'] },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Inspection recorded.' })
  async createDotInspection(
    @Body('assetId') assetId: string,
    @Body('inspectionDate') inspectionDate: string,
    @Body('result') result: 'CLEAN' | 'VIOLATION',
    @Body('violationsJson') violationsJson: any, // array of violation descriptions
  ) {
    const inspection = await this.prisma.dOTInspection.create({
      data: {
        assetId,
        inspectionDate: new Date(inspectionDate),
        result,
        violationsJson: JSON.stringify(violationsJson),
      },
      include: { asset: true },
    });

    // If there is a violation, auto-generate a high-priority Work Order linked to it
    if (result === 'VIOLATION') {
      const description = `DOT Roadside Inspection Violations: ${Array.isArray(violationsJson) ? violationsJson.join(', ') : JSON.stringify(violationsJson)}. Require immediate repair.`;

      // Set asset status to INOPERABLE
      await this.prisma.asset.update({
        where: { id: assetId },
        data: { status: AssetStatus.INOPERABLE },
      });

      const workOrder = await this.prisma.workOrder.create({
        data: {
          assetId,
          dotViolationId: inspection.id,
          priority: WorkOrderPriority.HIGH,
          type: WorkOrderType.INTERNAL,
          status: WorkOrderStatus.OPEN,
          description,
        },
      });

      this.notificationsService.emit({
        type: 'WORK_ORDER',
        title: `DOT Violation Work Order: ${inspection.asset.name}`,
        message: `High-priority work order auto-created to address inspection infractions.`,
        assetId: assetId,
        timestamp: new Date().toISOString(),
      });
    }

    const res = await this.prisma.dOTInspection.findUnique({
      where: { id: inspection.id },
      include: { asset: true, workOrders: true },
    });
    if (res) {
      (res as any).violationsJson = JSON.parse(res.violationsJson || '[]');
    }
    return res;
  }
}
