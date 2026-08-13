import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { InspectionStatus, AssetStatus } from '../enums';

@Injectable()
export class InspectionsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private notificationsService: NotificationsService,
  ) {}

  async findAll() {
    const list = await this.prisma.eDVIRInspection.findMany({
      include: {
        asset: true,
        driver: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return list.map(item => ({
      ...item,
      checklistJson: JSON.parse(item.checklistJson),
    }));
  }

  async create(data: {
    assetId: string;
    driverId: string;
    status: InspectionStatus;
    odometer: number;
    checklistJson: any;
    notes?: string;
  }) {
    const asset = await this.prisma.asset.findUnique({
      where: { id: data.assetId },
    });

    if (!asset) {
      throw new NotFoundException('Asset not found');
    }

    // 1. Create inspection log
    const inspection = await this.prisma.eDVIRInspection.create({
      data: {
        assetId: data.assetId,
        driverId: data.driverId,
        status: data.status,
        odometer: data.odometer,
        checklistJson: JSON.stringify(data.checklistJson),
        notes: data.notes,
      },
    });

    // 2. Update asset odometer if the submitted odometer is higher
    if (data.odometer > asset.odometer) {
      await this.prisma.asset.update({
        where: { id: data.assetId },
        data: { odometer: data.odometer },
      });
    }

    // 3. Flag asset status if inspection failed
    if (data.status === InspectionStatus.FAILED) {
      await this.prisma.asset.update({
        where: { id: data.assetId },
        data: { status: AssetStatus.INOPERABLE },
      });

      // Log the override/automatic update in the audit service
      await this.auditService.logChange({
        userId: data.driverId,
        action: 'UPDATE',
        entityName: 'Asset',
        entityId: data.assetId,
        beforeState: { status: asset.status },
        afterState: { status: AssetStatus.INOPERABLE },
      });

      // Emit push notification to maintenance admin
      this.notificationsService.emit({
        type: 'COMPLIANCE',
        title: `Failed Inspection: ${asset.name}`,
        message: `Driver reported a failed inspection. Asset marked as INOPERABLE. Notes: ${data.notes || 'No notes'}`,
        assetId: asset.id,
        timestamp: new Date().toISOString(),
      });
    } else {
      // If it passed and was inoperable, keep inoperable unless overridden by mechanic/admin
      // (as per requirements: drivers update via inspections, but admins/mechanics must clear it)
    }

    return {
      ...inspection,
      checklistJson: JSON.parse(inspection.checklistJson),
    };
  }
}
