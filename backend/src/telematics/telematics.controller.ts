import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PmService } from '../pm/pm.service';
import { NotificationsService } from '../notifications/notifications.service';
import { FaultStatus, WorkOrderPriority, WorkOrderType, WorkOrderStatus, AssetStatus } from '../enums';

@UseGuards(JwtAuthGuard)
@Controller('api/telematics')
export class TelematicsController {
  constructor(
    private prisma: PrismaService,
    private pmService: PmService,
    private notificationsService: NotificationsService,
  ) {}

  @Get('fault-codes')
  async getFaultCodes() {
    return this.prisma.faultCode.findMany({
      include: { asset: true, workOrder: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ELD ODOMETER SYNC WEBHOOK
  @Post('odometer')
  async syncOdometer(
    @Body('assetId') assetId: string,
    @Body('odometer') odometer: number,
  ) {
    // 1. Sync asset odometer
    const asset = await this.prisma.asset.update({
      where: { id: assetId },
      data: { odometer },
    });

    // 2. Trigger PM schedules recalculation for this asset
    await this.pmService.syncAllAssetPMs(assetId, odometer);

    return asset;
  }

  // ELD FAULT CODE INGESTION WEBHOOK (DTC/J1939)
  @Post('fault-code')
  async ingestFaultCode(
    @Body('assetId') assetId: string,
    @Body('source') source: string, // Motive, Samsara, Geotab
    @Body('code') code: string, // e.g. "SPN 91 FMI 9"
    @Body('description') description: string,
  ) {
    const asset = await this.prisma.asset.findUnique({ where: { id: assetId } });
    if (!asset) throw new Error('Asset not found');

    // 1. Create fault code entry
    const fault = await this.prisma.faultCode.create({
      data: {
        assetId,
        source,
        code,
        description,
        status: FaultStatus.ACTIVE,
      },
    });

    // 2. Flag asset status to NEEDS_ATTENTION
    await this.prisma.asset.update({
      where: { id: assetId },
      data: { status: AssetStatus.NEEDS_ATTENTION },
    });

    // 3. Auto-create an internal Work Order to address the diagnostic code
    const workOrder = await this.prisma.workOrder.create({
      data: {
        assetId,
        priority: WorkOrderPriority.MEDIUM,
        type: WorkOrderType.INTERNAL,
        status: WorkOrderStatus.OPEN,
        description: `Telematics Alert [${source}]: Diagnosed DTC Fault Code ${code} - ${description}. Check engine sensor.`,
      },
    });

    // Link fault code to the work order
    await this.prisma.faultCode.update({
      where: { id: fault.id },
      data: { workOrderId: workOrder.id },
    });

    // Emit live push notification to maintenance dashboard
    this.notificationsService.emit({
      type: 'WORK_ORDER',
      title: `Check Engine: ${asset.name}`,
      message: `Telematics reported J1939 Code ${code}: "${description}". Work order created.`,
      assetId: assetId,
      timestamp: new Date().toISOString(),
    });

    return { fault, workOrder };
  }
}
