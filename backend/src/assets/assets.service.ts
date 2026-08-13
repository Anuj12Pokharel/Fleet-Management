import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AuditService } from '../audit/audit.service';
import { AssetStatus, AssetType } from '../enums';

@Injectable()
export class AssetsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async findAll() {
    return this.prisma.asset.findMany({
      include: {
        parentAsset: true,
        childAssets: true,
        components: true,
        renewalAlerts: {
          where: { status: 'ACTIVE' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const asset = await this.prisma.asset.findUnique({
      where: { id },
      include: {
        parentAsset: true,
        childAssets: true,
        components: true,
        inspections: { orderBy: { createdAt: 'desc' }, take: 10 },
        pmSchedules: { include: { template: true } },
        workOrders: { orderBy: { createdAt: 'desc' }, take: 10 },
        renewalAlerts: true,
        fuelLogs: { orderBy: { createdAt: 'desc' }, take: 10 },
        tollRecords: { orderBy: { timestamp: 'desc' }, take: 10 },
        dotInspections: { orderBy: { inspectionDate: 'desc' }, take: 5 },
        emergencyTickets: { orderBy: { createdAt: 'desc' }, take: 5 },
        accidentClaims: { orderBy: { claimDate: 'desc' }, take: 5 },
        faultCodes: true,
      },
    });

    if (!asset) {
      throw new NotFoundException(`Asset with ID ${id} not found`);
    }
    return asset;
  }

  async create(data: {
    type: AssetType;
    name: string;
    vin: string;
    plateNumber: string;
    odometer?: number;
    fuelType?: string;
    parentAssetId?: string;
  }, userId?: string) {
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=asset-${data.vin}`;
    
    const asset = await this.prisma.asset.create({
      data: {
        ...data,
        qrCodeUrl,
      },
    });

    // Create sub-components automatically
    const baseComponents =
      data.type === AssetType.TRACTOR
        ? ['Engine', 'Fuel System', 'Electrical', 'Tyres', 'Axles']
        : ['Kingpin', 'Sliding Tandem', 'Door Seals', 'Tyres', 'Axles'];

    for (const compName of baseComponents) {
      await this.prisma.component.create({
        data: {
          assetId: asset.id,
          name: compName,
          status: AssetStatus.OPERABLE,
          qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=component-${compName.toLowerCase().replace(/ /g, '-')}-${asset.id}`,
        },
      });
    }

    await this.auditService.logChange({
      userId,
      action: 'CREATE',
      entityName: 'Asset',
      entityId: asset.id,
      afterState: asset,
    });

    return this.findOne(asset.id);
  }

  async update(id: string, data: any, userId?: string) {
    const before = await this.prisma.asset.findUnique({ where: { id } });
    if (!before) throw new NotFoundException('Asset not found');

    const asset = await this.prisma.asset.update({
      where: { id },
      data,
    });

    await this.auditService.logChange({
      userId,
      action: 'UPDATE',
      entityName: 'Asset',
      entityId: asset.id,
      beforeState: before,
      afterState: asset,
    });

    return asset;
  }

  async overrideStatus(id: string, status: AssetStatus, userId?: string) {
    const before = await this.prisma.asset.findUnique({ where: { id } });
    if (!before) throw new NotFoundException('Asset not found');

    const asset = await this.prisma.asset.update({
      where: { id },
      data: { status },
    });

    await this.auditService.logChange({
      userId,
      action: 'OVERRIDE',
      entityName: 'Asset',
      entityId: asset.id,
      beforeState: before,
      afterState: asset,
    });

    return asset;
  }

  async checkDispatchBlock(id: string) {
    const asset = await this.prisma.asset.findUnique({
      where: { id },
      include: {
        renewalAlerts: {
          where: { expiryDate: { lte: new Date() } },
        },
      },
    });

    if (!asset) return { blocked: false, reason: null };

    // Rule 1: Fail inspection flags status as Inoperable or Needs Attention
    if (asset.status === AssetStatus.INOPERABLE) {
      return { blocked: true, reason: 'Asset status is marked as INOPERABLE due to inspection failures or work order triggers.' };
    }

    if (asset.status === AssetStatus.NEEDS_ATTENTION) {
      return { blocked: true, reason: 'Asset status is marked as NEEDS_ATTENTION and requires admin override/clearance.' };
    }

    // Rule 2: Any expired compliance item blocks dispatch
    if (asset.renewalAlerts.length > 0) {
      const types = asset.renewalAlerts.map(a => a.type).join(', ');
      return { blocked: true, reason: `Expired compliance items detected: ${types}. Asset blocked.` };
    }

    return { blocked: false, reason: null };
  }

  async scanQR(code: string) {
    // Check if code matches an asset (e.g. prefix asset-)
    if (code.startsWith('asset-')) {
      const vin = code.substring(6);
      const asset = await this.prisma.asset.findUnique({
        where: { vin },
        include: { components: true, workOrders: true },
      });
      if (asset) return { type: 'ASSET', data: asset };
    }

    // Check if code matches a component
    if (code.startsWith('component-')) {
      // Format: component-[name]-[assetId]
      const parts = code.split('-');
      const assetId = parts[parts.length - 1];
      const nameParts = parts.slice(1, parts.length - 1);
      const name = nameParts.join(' ');
      
      const component = await this.prisma.component.findFirst({
        where: {
          assetId,
          name: name,
        },
        include: {
          asset: true,
          workOrders: { orderBy: { createdAt: 'desc' } },
        },
      });
      if (component) return { type: 'COMPONENT', data: component };
    }

    throw new NotFoundException('QR Code not recognized in fleet directory');
  }
}
