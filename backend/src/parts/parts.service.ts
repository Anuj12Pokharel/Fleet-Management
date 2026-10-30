import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class PartsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private notifications: NotificationsService,
  ) {}

  // ─── PARTS INVENTORY ───────────────────────────────────────────────────────

  async getAllParts() {
    return this.prisma.part.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPartById(id: string) {
    const part = await this.prisma.part.findUnique({ where: { id } });
    if (!part) throw new NotFoundException(`Part with ID ${id} not found.`);
    return part;
  }

  async createPart(data: {
    partNumber: string;
    name: string;
    category: string;
    stockQty?: number;
    reorderLevel?: number;
    unitCost?: number;
    location?: string;
    compatibleAssetsJson?: string;
  }, userId?: string) {
    const existing = await this.prisma.part.findUnique({
      where: { partNumber: data.partNumber },
    });
    if (existing) {
      throw new BadRequestException(`Part number ${data.partNumber} already exists.`);
    }

    const part = await this.prisma.part.create({
      data: {
        partNumber: data.partNumber,
        name: data.name,
        category: data.category,
        stockQty: data.stockQty ?? 0,
        reorderLevel: data.reorderLevel ?? 2,
        unitCost: data.unitCost ?? 0.0,
        location: data.location || 'Warehouse A',
        compatibleAssetsJson: data.compatibleAssetsJson,
      },
    });

    await this.audit.logChange({
      userId: userId || undefined,
      action: 'CREATE',
      entityName: 'Part',
      entityId: part.id,
      afterState: part,
    });

    return part;
  }

  async updatePart(id: string, data: Partial<{
    name: string;
    category: string;
    stockQty: number;
    reorderLevel: number;
    unitCost: number;
    location: string;
    compatibleAssetsJson: string;
  }>, userId?: string) {
    const before = await this.getPartById(id);

    const updated = await this.prisma.part.update({
      where: { id },
      data,
    });

    await this.audit.logChange({
      userId: userId || undefined,
      action: 'UPDATE',
      entityName: 'Part',
      entityId: id,
      beforeState: before,
      afterState: updated,
    });

    // Low stock notification trigger
    if (updated.stockQty <= updated.reorderLevel) {
      this.notifications.emit({
        type: 'PM_ALERT',
        title: 'Low Stock Warning',
        message: `Part ${updated.name} (${updated.partNumber}) has reached reorder threshold (${updated.stockQty} remaining).`,
        timestamp: new Date().toISOString(),
      });
    }

    return updated;
  }

  async usePart(id: string, qty: number, workOrderId?: string, userId?: string) {
    const part = await this.getPartById(id);
    if (qty <= 0) throw new BadRequestException('Quantity must be greater than 0.');
    if (part.stockQty < qty) {
      throw new BadRequestException(`Insufficient stock. Available: ${part.stockQty}, Requested: ${qty}`);
    }

    const updated = await this.prisma.part.update({
      where: { id },
      data: { stockQty: part.stockQty - qty },
    });

    await this.audit.logChange({
      userId: userId || undefined,
      action: 'USE_PART',
      entityName: 'Part',
      entityId: id,
      beforeState: { stockQty: part.stockQty },
      afterState: { stockQty: updated.stockQty, qtyUsed: qty, workOrderId },
    });

    if (updated.stockQty <= updated.reorderLevel) {
      this.notifications.emit({
        type: 'PM_ALERT',
        title: 'Low Stock Alert',
        message: `Part ${updated.name} is now low in stock (${updated.stockQty} left). Please restock.`,
        timestamp: new Date().toISOString(),
      });
    }

    return updated;
  }

  async restockPart(id: string, qty: number, userId?: string) {
    const part = await this.getPartById(id);
    if (qty <= 0) throw new BadRequestException('Quantity must be greater than 0.');

    const updated = await this.prisma.part.update({
      where: { id },
      data: { stockQty: part.stockQty + qty },
    });

    await this.audit.logChange({
      userId: userId || undefined,
      action: 'RESTOCK_PART',
      entityName: 'Part',
      entityId: id,
      beforeState: { stockQty: part.stockQty },
      afterState: { stockQty: updated.stockQty, qtyAdded: qty },
    });

    return updated;
  }

  async deletePart(id: string, userId?: string) {
    const before = await this.getPartById(id);
    await this.prisma.part.delete({ where: { id } });

    await this.audit.logChange({
      userId: userId || undefined,
      action: 'DELETE',
      entityName: 'Part',
      entityId: id,
      beforeState: before,
    });

    return { success: true, message: `Part ${before.partNumber} deleted.` };
  }

  // ─── PART LOCATIONS ────────────────────────────────────────────────────────

  async getAllLocations() {
    return this.prisma.partLocation.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async createLocation(data: { name: string; type: string; address?: string; capacity?: number }) {
    return this.prisma.partLocation.create({
      data: {
        name: data.name,
        type: data.type,
        address: data.address,
        capacity: data.capacity ?? 100,
      },
    });
  }

  // ─── PART CATEGORIES ───────────────────────────────────────────────────────

  async getAllCategories() {
    return this.prisma.partCategory.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async createCategory(data: { name: string; code: string; description?: string }) {
    return this.prisma.partCategory.create({
      data: {
        name: data.name,
        code: data.code,
        description: data.description,
      },
    });
  }

  // ─── PART MANUFACTURERS ────────────────────────────────────────────────────

  async getAllManufacturers() {
    return this.prisma.partManufacturer.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async createManufacturer(data: { name: string; country?: string; contactInfo?: string; isPreferred?: boolean }) {
    return this.prisma.partManufacturer.create({
      data: {
        name: data.name,
        country: data.country || 'USA',
        contactInfo: data.contactInfo,
        isPreferred: data.isPreferred ?? false,
      },
    });
  }

  // ─── MEASUREMENT UNITS ─────────────────────────────────────────────────────

  async getAllUnits() {
    return this.prisma.measurementUnit.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async createUnit(data: { name: string; symbol: string; type: string }) {
    return this.prisma.measurementUnit.create({
      data: {
        name: data.name,
        symbol: data.symbol,
        type: data.type,
      },
    });
  }
}
