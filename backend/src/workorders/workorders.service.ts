import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RequestStatus, WorkOrderStatus, WorkOrderType, PurchaseOrderStatus, AssetStatus, WorkOrderPriority } from '../enums';

@Injectable()
export class WorkordersService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private notificationsService: NotificationsService,
  ) {}

  // SERVICE REQUESTS
  async findAllRequests() {
    const list = await this.prisma.serviceRequest.findMany({
      include: {
        asset: true,
        driver: { select: { id: true, name: true, email: true } },
        workOrder: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return list.map(item => ({
      ...item,
      mediaUrls: JSON.parse(item.mediaUrls || '[]'),
    }));
  }

  async createRequest(data: { driverId: string; assetId: string; description: string; mediaUrls: string[] }) {
    const asset = await this.prisma.asset.findUnique({ where: { id: data.assetId } });
    if (!asset) throw new NotFoundException('Asset not found');

    const request = await this.prisma.serviceRequest.create({
      data: {
        assetId: data.assetId,
        driverId: data.driverId,
        description: data.description,
        mediaUrls: JSON.stringify(data.mediaUrls),
        status: RequestStatus.PENDING,
      },
      include: { asset: true },
    });

    // Notify maintenance admin
    this.notificationsService.emit({
      type: 'WORK_ORDER',
      title: `New Service Request: ${asset.name}`,
      message: `Driver Bob reported issue: "${data.description.substring(0, 40)}..."`,
      assetId: asset.id,
      timestamp: new Date().toISOString(),
    });

    return {
      ...request,
      mediaUrls: JSON.parse(request.mediaUrls),
    };
  }

  async approveRequest(requestId: string, details: {
    type: WorkOrderType;
    priority: WorkOrderPriority;
    assignedMechanicId?: string;
    vendorId?: string;
    description: string;
  }, userId?: string) {
    const request = await this.prisma.serviceRequest.findUnique({
      where: { id: requestId },
      include: { asset: true },
    });
    if (!request) throw new NotFoundException('Service request not found');
    if (request.status !== RequestStatus.PENDING) {
      throw new BadRequestException('Request has already been processed');
    }

    // 1. Update request status to APPROVED
    await this.prisma.serviceRequest.update({
      where: { id: requestId },
      data: { status: RequestStatus.APPROVED },
    });

    // 2. Create the Work Order
    const workOrder = await this.prisma.workOrder.create({
      data: {
        serviceRequestId: requestId,
        assetId: request.assetId,
        type: details.type,
        priority: details.priority,
        description: details.description,
        assignedMechanicId: details.type === WorkOrderType.INTERNAL ? details.assignedMechanicId : null,
        vendorId: details.type === WorkOrderType.EXTERNAL ? details.vendorId : null,
        status: WorkOrderStatus.OPEN,
      },
    });

    // 3. If External Work Order, generate a Purchase Order
    let purchaseOrder: any = null;
    if (details.type === WorkOrderType.EXTERNAL) {
      if (!details.vendorId) throw new BadRequestException('Vendor is required for external work orders');
      
      const vendor = await this.prisma.vendor.findUnique({ where: { id: details.vendorId } });
      if (!vendor) throw new NotFoundException('Vendor not found');

      purchaseOrder = await this.prisma.purchaseOrder.create({
        data: {
          workOrderId: workOrder.id,
          vendorId: details.vendorId,
          amount: 0.0, // initialized at 0, filled on invoice ingestion/completion
          status: PurchaseOrderStatus.PENDING,
        },
      });
    }

    // Notify assignee / mechanic
    if (details.type === WorkOrderType.INTERNAL && details.assignedMechanicId) {
      this.notificationsService.emit({
        type: 'WORK_ORDER',
        title: `Work Order Assigned: ${request.asset.name}`,
        message: `Priority: ${details.priority}. Task: ${details.description}`,
        assetId: request.assetId,
        timestamp: new Date().toISOString(),
      });
    }

    await this.auditService.logChange({
      userId,
      action: 'UPDATE',
      entityName: 'ServiceRequest',
      entityId: requestId,
      beforeState: { status: RequestStatus.PENDING },
      afterState: { status: RequestStatus.APPROVED, workOrderId: workOrder.id },
    });

    return { workOrder, purchaseOrder };
  }

  // WORK ORDERS
  async findAllWorkOrders() {
    return this.prisma.workOrder.findMany({
      include: {
        asset: true,
        component: true,
        assignedMechanic: { select: { id: true, name: true, email: true } },
        vendor: true,
        purchaseOrder: true,
        serviceRequest: true,
        partsUsed: { include: { part: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createWorkOrder(data: {
    assetId: string;
    priority: WorkOrderPriority;
    type: WorkOrderType;
    description: string;
    assignedMechanicId?: string;
    vendorId?: string;
  }, userId?: string) {
    const asset = await this.prisma.asset.findUnique({ where: { id: data.assetId } });
    if (!asset) throw new NotFoundException('Asset not found');

    const workOrder = await this.prisma.workOrder.create({
      data: {
        assetId: data.assetId,
        priority: data.priority,
        type: data.type,
        status: WorkOrderStatus.OPEN,
        description: data.description,
        assignedMechanicId: data.assignedMechanicId,
        vendorId: data.vendorId,
      },
      include: {
        asset: true,
        assignedMechanic: { select: { id: true, name: true, email: true } },
        vendor: true,
      },
    });

    if (asset.status === AssetStatus.OPERABLE) {
      await this.prisma.asset.update({
        where: { id: data.assetId },
        data: { status: AssetStatus.NEEDS_ATTENTION },
      });
    }

    this.notificationsService.emit({
      type: 'WORK_ORDER',
      title: `Work Order Created: ${asset.name}`,
      message: `Priority: ${data.priority}. ${data.description}`,
      assetId: data.assetId,
      timestamp: new Date().toISOString(),
    });

    if (userId) {
      await this.auditService.logChange({
        userId,
        action: 'CREATE',
        entityName: 'WorkOrder',
        entityId: workOrder.id,
        afterState: { id: workOrder.id, assetId: data.assetId, priority: data.priority },
      });
    }

    return workOrder;
  }

  async updateWorkOrder(id: string, data: {
    status?: WorkOrderStatus;
    priority?: WorkOrderPriority;
    assignedMechanicId?: string;
    vendorId?: string;
    description?: string;
    laborCost?: number;
    partsCost?: number;
  }, userId?: string) {
    const before = await this.prisma.workOrder.findUnique({ where: { id } });
    if (!before) throw new NotFoundException('Work order not found');

    const totalCost = (data.laborCost ?? before.laborCost) + (data.partsCost ?? before.partsCost);

    const updated = await this.prisma.workOrder.update({
      where: { id },
      data: {
        ...data,
        totalCost,
        completedAt: data.status === WorkOrderStatus.COMPLETED ? new Date() : null,
      },
      include: { asset: true },
    });

    // Update corresponding Purchase Order amount if external
    if (updated.type === WorkOrderType.EXTERNAL) {
      await this.prisma.purchaseOrder.updateMany({
        where: { workOrderId: id },
        data: { amount: totalCost },
      });
    }

    // If completed, check and restore asset status
    if (data.status === WorkOrderStatus.COMPLETED) {
      // Check if there are other OPEN/IN_PROGRESS work orders for this asset
      const activeWosCount = await this.prisma.workOrder.count({
        where: {
          assetId: updated.assetId,
          status: { in: [WorkOrderStatus.OPEN, WorkOrderStatus.IN_PROGRESS] },
        },
      });

      if (activeWosCount === 0) {
        // Clear status to OPERABLE
        await this.prisma.asset.update({
          where: { id: updated.assetId },
          data: { status: AssetStatus.OPERABLE },
        });

        await this.auditService.logChange({
          userId,
          action: 'UPDATE',
          entityName: 'Asset',
          entityId: updated.assetId,
          beforeState: { status: updated.asset.status },
          afterState: { status: AssetStatus.OPERABLE },
        });
      }
    }

    await this.auditService.logChange({
      userId,
      action: 'UPDATE',
      entityName: 'WorkOrder',
      entityId: id,
      beforeState: before,
      afterState: updated,
    });

    return updated;
  }

  // PURCHASE ORDERS
  async findAllPurchaseOrders() {
    return this.prisma.purchaseOrder.findMany({
      include: {
        workOrder: { include: { asset: true } },
        vendor: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // WORK ORDER PARTS (LINE ITEMS)
  async addPartLineItem(workOrderId: string, partId: string, quantity: number, userId?: string) {
    const workOrder = await this.prisma.workOrder.findUnique({ where: { id: workOrderId } });
    if (!workOrder) throw new NotFoundException('Work order not found');

    const part = await this.prisma.part.findUnique({ where: { id: partId } });
    if (!part) throw new NotFoundException('Part not found');

    if (part.stockQty < quantity) {
      throw new BadRequestException(`Insufficient stock for part "${part.name}". Available: ${part.stockQty}, Requested: ${quantity}`);
    }

    const unitCost = part.unitCost;
    const lineTotal = unitCost * quantity;

    // Transactionally create line item and deduct stock
    const result = await this.prisma.$transaction(async (tx) => {
      const lineItem = await tx.workOrderPart.create({
        data: {
          workOrderId,
          partId,
          quantity,
          unitCost,
          totalCost: lineTotal,
        },
        include: { part: true },
      });

      const updatedPart = await tx.part.update({
        where: { id: partId },
        data: { stockQty: part.stockQty - quantity },
      });

      const newPartsCost = workOrder.partsCost + lineTotal;
      const newTotalCost = workOrder.laborCost + newPartsCost;

      const updatedWo = await tx.workOrder.update({
        where: { id: workOrderId },
        data: {
          partsCost: newPartsCost,
          totalCost: newTotalCost,
        },
        include: { partsUsed: { include: { part: true } }, asset: true },
      });

      // Update PO amount if external
      if (updatedWo.type === WorkOrderType.EXTERNAL) {
        await tx.purchaseOrder.updateMany({
          where: { workOrderId },
          data: { amount: newTotalCost },
        });
      }

      return { lineItem, updatedWo, updatedPart };
    });

    // Check low stock
    if (result.updatedPart.stockQty <= result.updatedPart.reorderLevel) {
      this.notificationsService.emit({
        type: 'PM_ALERT',
        title: 'Low Stock Alert',
        message: `Part ${result.updatedPart.name} (${result.updatedPart.partNumber}) has reached reorder threshold (${result.updatedPart.stockQty} remaining).`,
        timestamp: new Date().toISOString(),
      });
    }

    await this.auditService.logChange({
      userId,
      action: 'USE_PART',
      entityName: 'WorkOrder',
      entityId: workOrderId,
      afterState: { partId, quantity, unitCost, totalCost: lineTotal },
    });

    return result.updatedWo;
  }

  async removePartLineItem(lineItemId: string, userId?: string) {
    const lineItem = await this.prisma.workOrderPart.findUnique({
      where: { id: lineItemId },
      include: { workOrder: true },
    });
    if (!lineItem) throw new NotFoundException('Work order part line item not found');

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.part.update({
        where: { id: lineItem.partId },
        data: { stockQty: { increment: lineItem.quantity } },
      });

      await tx.workOrderPart.delete({ where: { id: lineItemId } });

      const newPartsCost = Math.max(0, lineItem.workOrder.partsCost - lineItem.totalCost);
      const newTotalCost = lineItem.workOrder.laborCost + newPartsCost;

      const updatedWo = await tx.workOrder.update({
        where: { id: lineItem.workOrderId },
        data: {
          partsCost: newPartsCost,
          totalCost: newTotalCost,
        },
        include: { partsUsed: { include: { part: true } } },
      });

      return updatedWo;
    });

    return result;
  }
}
