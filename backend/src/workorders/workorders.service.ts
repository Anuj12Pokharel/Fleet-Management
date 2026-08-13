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
      },
      orderBy: { createdAt: 'desc' },
    });
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
}
