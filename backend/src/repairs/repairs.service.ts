import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import {
  IsArray, IsBoolean, IsIn, IsNumber, IsOptional, IsString, MaxLength, ArrayMaxSize, ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PrismaService } from '../prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

export type RepairActorRole = 'CARRIER' | 'DRIVER';

export interface RepairActor {
  id: string;
  name: string;
  email?: string;
  role: RepairActorRole;
  tenantId: string;
}

export const REPAIR_CATEGORIES = ['ENGINE', 'BRAKES', 'TIRES', 'ELECTRICAL', 'BODY', 'TRAILER', 'OTHER'];
export const REPAIR_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'EMERGENCY'];
export const REPAIR_STATUSES = [
  'SUBMITTED', 'NEEDS_INFO', 'REJECTED', 'SCHEDULED', 'IN_PROGRESS', 'WAITING_PARTS',
  'COMPLETED', 'VERIFIED', 'REOPENED', 'CLOSED', 'CANCELLED',
];
const OPEN_STATUSES = ['SUBMITTED', 'NEEDS_INFO', 'SCHEDULED', 'IN_PROGRESS', 'WAITING_PARTS', 'REOPENED'];
const DRIVER_CONFIRM_WINDOW_DAYS = 7;

/** Which statuses a carrier can move a repair to, from each status. */
const CARRIER_TRANSITIONS: Record<string, string[]> = {
  SUBMITTED: ['NEEDS_INFO', 'REJECTED', 'SCHEDULED', 'IN_PROGRESS', 'CANCELLED'],
  NEEDS_INFO: ['SUBMITTED', 'REJECTED', 'SCHEDULED', 'IN_PROGRESS', 'CANCELLED'],
  SCHEDULED: ['IN_PROGRESS', 'WAITING_PARTS', 'COMPLETED', 'CANCELLED'],
  IN_PROGRESS: ['WAITING_PARTS', 'COMPLETED', 'CANCELLED'],
  WAITING_PARTS: ['IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
  COMPLETED: ['IN_PROGRESS', 'CLOSED'],
  VERIFIED: ['IN_PROGRESS', 'CLOSED'],
  REOPENED: ['SCHEDULED', 'IN_PROGRESS', 'WAITING_PARTS', 'COMPLETED', 'CANCELLED'],
  REJECTED: [],
  CLOSED: [],
  CANCELLED: [],
};

export class RepairPartDto {
  @IsString() @MaxLength(200) name: string;
  @Type(() => Number) @IsNumber() qty: number;
  @Type(() => Number) @IsNumber() unitCost: number;
}

export class CreateRepairDto {
  @IsOptional() @IsString() truckId?: string;
  @IsString() @MaxLength(200) truckName: string;
  @IsOptional() @IsString() truckPlate?: string;
  @IsOptional() @IsString() truckVin?: string;
  @IsOptional() @IsString() carrierId?: string;
  @IsOptional() @IsString() carrierName?: string;
  @IsOptional() @IsString() @MaxLength(200) componentName?: string;
  @IsString() @MaxLength(200) title: string;
  @IsString() @MaxLength(4000) description: string;
  @IsOptional() @IsIn(REPAIR_CATEGORIES) category?: string;
  @IsOptional() @IsBoolean() canDrive?: boolean;
  @IsOptional() @IsBoolean() roadside?: boolean;
  @IsOptional() @Type(() => Number) @IsNumber() odometer?: number;
  @IsOptional() @Type(() => Number) @IsNumber() gpsLatitude?: number;
  @IsOptional() @Type(() => Number) @IsNumber() gpsLongitude?: number;
  @IsOptional() @IsArray() @ArrayMaxSize(10) @IsString({ each: true }) mediaUrls?: string[];
  // Carrier-only (ignored for drivers)
  @IsOptional() @IsString() driverId?: string;
  @IsOptional() @IsString() driverName?: string;
  @IsOptional() @IsString() driverEmail?: string;
  @IsOptional() @IsIn(REPAIR_PRIORITIES) priority?: string;
  @IsOptional() @IsIn(['INTERNAL', 'EXTERNAL']) repairType?: string;
  @IsOptional() @IsString() vendorName?: string;
  @IsOptional() @IsString() scheduledAt?: string;
  @IsOptional() @IsString() dueAt?: string;
}

export class UpdateRepairDto {
  @IsOptional() @IsString() @MaxLength(200) title?: string;
  @IsOptional() @IsString() @MaxLength(4000) description?: string;
  @IsOptional() @IsIn(REPAIR_CATEGORIES) category?: string;
  @IsOptional() @IsIn(REPAIR_PRIORITIES) priority?: string;
  @IsOptional() @IsString() componentName?: string;
  @IsOptional() @Type(() => Number) @IsNumber() odometer?: number;
  @IsOptional() @IsIn(['INTERNAL', 'EXTERNAL']) repairType?: string;
  @IsOptional() @IsString() vendorName?: string;
  @IsOptional() @IsString() vendorContact?: string;
  @IsOptional() @Type(() => Number) @IsNumber() estimateAmount?: number;
  @IsOptional() @Type(() => Number) @IsNumber() laborCost?: number;
  @IsOptional() @Type(() => Number) @IsNumber() otherCost?: number;
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => RepairPartDto) parts?: RepairPartDto[];
  @IsOptional() @IsString() poNumber?: string;
  @IsOptional() @IsString() invoiceUrl?: string;
  @IsOptional() @IsString() @MaxLength(4000) internalNotes?: string;
  @IsOptional() @IsString() @MaxLength(2000) cause?: string;
  @IsOptional() @IsString() @MaxLength(4000) workPerformed?: string;
  @IsOptional() @IsString() scheduledAt?: string;
  @IsOptional() @IsString() dueAt?: string;
  @IsOptional() @IsString() driverId?: string;
  @IsOptional() @IsString() driverName?: string;
  @IsOptional() @IsString() driverEmail?: string;
}

export class TransitionRepairDto {
  @IsIn(REPAIR_STATUSES) to: string;
  @IsOptional() @IsString() @MaxLength(2000) note?: string;
  /** If true the note is kept carrier-only */
  @IsOptional() @IsBoolean() internal?: boolean;
}

export class CommentRepairDto {
  @IsString() @MaxLength(2000) note: string;
  @IsOptional() @IsBoolean() internal?: boolean;
}

export class ConfirmRepairDto {
  @IsIn(['OK', 'NOT_FIXED']) result: string;
  @IsOptional() @IsString() @MaxLength(2000) comment?: string;
}

export class PaymentRepairDto {
  @IsBoolean() paid: boolean;
}

export class ListRepairsQuery {
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() priority?: string;
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsString() truckId?: string;
}

const safeJson = <T>(s: string | null | undefined, fallback: T): T => {
  try {
    return s ? (JSON.parse(s) as T) : fallback;
  } catch {
    return fallback;
  }
};

const toDate = (v?: string | null): Date | null => {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
};

const STATUS_LABELS: Record<string, string> = {
  SUBMITTED: 'Submitted',
  NEEDS_INFO: 'Needs more information',
  REJECTED: 'Rejected',
  SCHEDULED: 'Scheduled',
  IN_PROGRESS: 'In progress',
  WAITING_PARTS: 'Waiting on parts',
  COMPLETED: 'Completed - please confirm',
  VERIFIED: 'Confirmed fixed',
  REOPENED: 'Reopened',
  CLOSED: 'Closed',
  CANCELLED: 'Cancelled',
};

@Injectable()
export class RepairsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  // ───────────────────────── projections ─────────────────────────

  /** Everything a carrier may see. */
  private carrierView(r: any, events: any[] = []) {
    return {
      ...r,
      mediaUrls: safeJson<string[]>(r.mediaUrlsJson, []),
      parts: safeJson<any[]>(r.partsJson, []),
      statusLabel: STATUS_LABELS[r.status] || r.status,
      allowedTransitions: CARRIER_TRANSITIONS[r.status] || [],
      overdue: !!r.dueAt && OPEN_STATUSES.includes(r.status) && new Date(r.dueAt).getTime() < Date.now(),
      events,
    };
  }

  /** The driver never receives costs, vendor details, internal notes or payment info. */
  private driverView(r: any, events: any[] = []) {
    const canConfirm = this.canDriverConfirm(r);
    return {
      id: r.id,
      title: r.title,
      description: r.description,
      category: r.category,
      priority: r.priority,
      status: r.status,
      statusLabel: STATUS_LABELS[r.status] || r.status,
      canDrive: r.canDrive,
      truckName: r.truckName,
      truckPlate: r.truckPlate,
      componentName: r.componentName,
      odometer: r.odometer,
      mediaUrls: safeJson<string[]>(r.mediaUrlsJson, []),
      rejectionReason: r.rejectionReason,
      scheduledAt: r.scheduledAt,
      dueAt: r.dueAt,
      completedAt: r.completedAt,
      driverResult: r.driverResult,
      driverComment: r.driverComment,
      driverConfirmedAt: r.driverConfirmedAt,
      canConfirm,
      canCancel: ['SUBMITTED', 'NEEDS_INFO'].includes(r.status),
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      events: events
        .filter((e) => e.visibility === 'PUBLIC')
        .map((e) => ({
          id: e.id,
          action: e.action,
          toStatus: e.toStatus,
          note: e.note,
          actorRole: e.actorRole,
          // Carrier staff are shown as "Carrier"; the driver's own name is not needed
          actorName: e.actorRole === 'CARRIER' ? 'Carrier' : 'You',
          createdAt: e.createdAt,
        })),
    };
  }

  private project(actor: RepairActor, r: any, events: any[] = []) {
    return actor.role === 'CARRIER' ? this.carrierView(r, events) : this.driverView(r, events);
  }

  private canDriverConfirm(r: any): boolean {
    if (r.status !== 'COMPLETED' || !r.completedAt) return false;
    const days = (Date.now() - new Date(r.completedAt).getTime()) / 86_400_000;
    return days <= DRIVER_CONFIRM_WINDOW_DAYS;
  }

  // ───────────────────────── access ─────────────────────────

  private ownedByDriver(actor: RepairActor, r: { driverId: string | null; driverEmail: string | null }) {
    const email = actor.email?.toLowerCase();
    return r.driverId === actor.id || (!!email && r.driverEmail === email);
  }

  /** Loads a repair the actor is allowed to touch, or throws. */
  private async loadForActor(actor: RepairActor, id: string) {
    const r = await this.prisma.repair.findUnique({ where: { id } });
    if (!r || r.tenantId !== actor.tenantId) throw new NotFoundException('Repair not found');
    if (actor.role === 'DRIVER' && !this.ownedByDriver(actor, r)) throw new NotFoundException('Repair not found');
    return r;
  }

  private requireCarrier(actor: RepairActor) {
    if (actor.role !== 'CARRIER') throw new ForbiddenException('Only the carrier can do this');
  }

  private async addEvent(
    actor: RepairActor,
    repairId: string,
    e: { action: string; fromStatus?: string | null; toStatus?: string | null; note?: string | null; visibility?: string },
  ) {
    await this.prisma.repairEvent.create({
      data: {
        repairId,
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        action: e.action,
        fromStatus: e.fromStatus ?? null,
        toStatus: e.toStatus ?? null,
        note: e.note ?? null,
        visibility: e.visibility ?? 'PUBLIC',
      },
    });
  }

  private notify(title: string, message: string, assetId?: string) {
    try {
      this.notifications.emit({ type: 'REPAIR', title, message, assetId, timestamp: new Date().toISOString() });
    } catch {
      // notifications must never break a repair action
    }
  }

  // ───────────────────────── queries ─────────────────────────

  async list(actor: RepairActor, q: ListRepairsQuery) {
    const where: any = { tenantId: actor.tenantId };
    if (actor.role === 'DRIVER') {
      const email = actor.email?.toLowerCase();
      where.AND = [{ OR: [{ driverId: actor.id }, ...(email ? [{ driverEmail: email }] : [])] }];
    }
    if (q.status && q.status !== 'ALL') {
      where.status = q.status === 'OPEN' ? { in: OPEN_STATUSES } : q.status;
    }
    if (q.priority && q.priority !== 'ALL') where.priority = q.priority;
    if (q.truckId) where.truckId = q.truckId;
    if (q.search) {
      where.OR = [
        { title: { contains: q.search } },
        { truckName: { contains: q.search } },
        { driverName: { contains: q.search } },
        { vendorName: { contains: q.search } },
      ];
    }
    const rows = await this.prisma.repair.findMany({ where, orderBy: { createdAt: 'desc' }, take: 300 });
    return rows.map((r) => this.project(actor, r));
  }

  async get(actor: RepairActor, id: string) {
    const r = await this.loadForActor(actor, id);
    const events = await this.prisma.repairEvent.findMany({ where: { repairId: id }, orderBy: { createdAt: 'asc' } });
    return this.project(actor, r, events);
  }

  async summary(actor: RepairActor) {
    this.requireCarrier(actor);
    const all = await this.prisma.repair.findMany({ where: { tenantId: actor.tenantId } });
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const completed = all.filter((r) => r.completedAt);
    const avgDays = completed.length
      ? completed.reduce((s, r) => s + (new Date(r.completedAt as Date).getTime() - new Date(r.createdAt).getTime()) / 86_400_000, 0) /
        completed.length
      : 0;
    return {
      total: all.length,
      awaitingReview: all.filter((r) => r.status === 'SUBMITTED' || r.status === 'NEEDS_INFO').length,
      inProgress: all.filter((r) => r.status === 'IN_PROGRESS' || r.status === 'SCHEDULED').length,
      waitingParts: all.filter((r) => r.status === 'WAITING_PARTS').length,
      awaitingDriver: all.filter((r) => r.status === 'COMPLETED').length,
      reopened: all.filter((r) => r.status === 'REOPENED').length,
      overdue: all.filter((r) => r.dueAt && OPEN_STATUSES.includes(r.status) && new Date(r.dueAt).getTime() < Date.now()).length,
      unitsDown: new Set(all.filter((r) => OPEN_STATUSES.includes(r.status) && !r.canDrive).map((r) => r.truckId || r.truckName)).size,
      unpaid: all.filter((r) => ['COMPLETED', 'VERIFIED', 'CLOSED'].includes(r.status) && r.paymentStatus === 'UNPAID' && r.totalCost > 0).length,
      spendThisMonth: all
        .filter((r) => r.completedAt && new Date(r.completedAt) >= monthStart)
        .reduce((s, r) => s + r.totalCost, 0),
      avgDaysToComplete: Math.round(avgDays * 10) / 10,
    };
  }

  // ───────────────────────── commands ─────────────────────────

  async create(actor: RepairActor, dto: CreateRepairDto) {
    const isCarrier = actor.role === 'CARRIER';
    const roadside = !!dto.roadside;
    const canDrive = dto.canDrive ?? true;

    // Drivers cannot choose priority: it is derived from how serious they say it is
    const priority = isCarrier && dto.priority ? dto.priority : roadside ? 'EMERGENCY' : canDrive ? 'MEDIUM' : 'HIGH';

    const repair = await this.prisma.repair.create({
      data: {
        tenantId: actor.tenantId,
        carrierId: dto.carrierId || null,
        carrierName: dto.carrierName || null,
        truckId: dto.truckId || null,
        truckName: dto.truckName,
        truckPlate: dto.truckPlate || null,
        truckVin: dto.truckVin || null,
        componentName: dto.componentName || null,
        driverId: isCarrier ? dto.driverId || null : actor.id,
        driverName: isCarrier ? dto.driverName || null : actor.name,
        driverEmail: (isCarrier ? dto.driverEmail : actor.email)?.toLowerCase() || null,
        title: dto.title,
        description: dto.description,
        category: dto.category || 'OTHER',
        priority,
        source: isCarrier ? 'CARRIER' : 'DRIVER',
        canDrive,
        odometer: dto.odometer ?? null,
        gpsLatitude: dto.gpsLatitude ?? null,
        gpsLongitude: dto.gpsLongitude ?? null,
        mediaUrlsJson: JSON.stringify(dto.mediaUrls || []),
        // Carrier-created repairs skip review; driver requests wait for the carrier
        status: isCarrier ? 'SCHEDULED' : 'SUBMITTED',
        repairType: isCarrier ? dto.repairType || 'INTERNAL' : 'INTERNAL',
        vendorName: isCarrier ? dto.vendorName || null : null,
        scheduledAt: isCarrier ? toDate(dto.scheduledAt) : null,
        dueAt: isCarrier ? toDate(dto.dueAt) : null,
        createdById: actor.id,
        createdByName: actor.name,
        createdByRole: actor.role,
      },
    });

    await this.addEvent(actor, repair.id, {
      action: 'CREATED',
      toStatus: repair.status,
      note: isCarrier ? 'Repair created by carrier' : 'Repair request submitted',
    });

    if (!isCarrier) {
      this.notify(
        roadside ? 'Roadside breakdown reported' : 'New repair request',
        `${actor.name} reported: ${dto.title} (${dto.truckName})`,
        dto.truckId,
      );
    }
    return this.project(actor, repair);
  }

  async update(actor: RepairActor, id: string, dto: UpdateRepairDto) {
    this.requireCarrier(actor);
    const r = await this.loadForActor(actor, id);
    if (['CLOSED', 'CANCELLED', 'REJECTED'].includes(r.status)) {
      throw new BadRequestException(`A ${r.status.toLowerCase()} repair can no longer be edited`);
    }

    const data: any = {};
    const direct = [
      'title', 'description', 'category', 'priority', 'componentName', 'odometer', 'repairType', 'vendorName',
      'vendorContact', 'estimateAmount', 'poNumber', 'invoiceUrl', 'internalNotes', 'cause', 'workPerformed',
      'driverId', 'driverName',
    ] as const;
    if (dto.driverEmail !== undefined) data.driverEmail = dto.driverEmail ? dto.driverEmail.toLowerCase() : null;
    for (const k of direct) if ((dto as any)[k] !== undefined) data[k] = (dto as any)[k];
    if (dto.scheduledAt !== undefined) data.scheduledAt = toDate(dto.scheduledAt);
    if (dto.dueAt !== undefined) data.dueAt = toDate(dto.dueAt);

    // Costs: parts lines are summed, total is always labor + parts + other
    const labor = dto.laborCost ?? r.laborCost;
    const other = dto.otherCost ?? r.otherCost;
    let partsCost = r.partsCost;
    if (dto.parts) {
      data.partsJson = JSON.stringify(dto.parts);
      partsCost = dto.parts.reduce((s, p) => s + (p.qty || 0) * (p.unitCost || 0), 0);
    }
    if (dto.laborCost !== undefined) data.laborCost = labor;
    if (dto.otherCost !== undefined) data.otherCost = other;
    data.partsCost = partsCost;
    data.totalCost = Math.round((labor + partsCost + other) * 100) / 100;

    const updated = await this.prisma.repair.update({ where: { id }, data });
    await this.addEvent(actor, id, { action: 'UPDATED', note: 'Details updated', visibility: 'INTERNAL' });
    return this.carrierView(updated);
  }

  async transition(actor: RepairActor, id: string, dto: TransitionRepairDto) {
    this.requireCarrier(actor);
    const r = await this.loadForActor(actor, id);
    const allowed = CARRIER_TRANSITIONS[r.status] || [];
    if (!allowed.includes(dto.to)) {
      throw new BadRequestException(`Cannot move a repair from ${r.status} to ${dto.to}`);
    }
    const note = dto.note?.trim();
    if (['REJECTED', 'NEEDS_INFO'].includes(dto.to) && !note) {
      throw new BadRequestException(dto.to === 'REJECTED' ? 'A reason is required to reject a request' : 'Say what information is needed');
    }
    if (dto.to === 'COMPLETED' && !r.workPerformed?.trim()) {
      throw new BadRequestException('Enter the work performed before marking the repair complete');
    }

    const now = new Date();
    const data: any = { status: dto.to };
    if (dto.to === 'REJECTED') data.rejectionReason = note;
    if (dto.to === 'IN_PROGRESS' && !r.startedAt) data.startedAt = now;
    if (dto.to === 'COMPLETED') data.completedAt = now;
    if (dto.to === 'CLOSED') data.closedAt = now;
    // Re-working a finished repair clears the earlier completion and driver answer
    if (dto.to === 'IN_PROGRESS' && ['COMPLETED', 'VERIFIED'].includes(r.status)) {
      data.completedAt = null;
      data.driverResult = null;
      data.driverConfirmedAt = null;
    }

    const updated = await this.prisma.repair.update({ where: { id }, data });
    await this.addEvent(actor, id, {
      action: 'STATUS',
      fromStatus: r.status,
      toStatus: dto.to,
      note,
      visibility: dto.internal ? 'INTERNAL' : 'PUBLIC',
    });

    if (r.driverId && ['REJECTED', 'NEEDS_INFO', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED'].includes(dto.to)) {
      this.notify(`Repair ${STATUS_LABELS[dto.to].toLowerCase()}`, `${r.title} (${r.truckName})`, r.truckId || undefined);
    }
    return this.carrierView(updated);
  }

  async comment(actor: RepairActor, id: string, dto: CommentRepairDto) {
    const r = await this.loadForActor(actor, id);
    if (['CLOSED', 'CANCELLED', 'REJECTED'].includes(r.status)) {
      throw new BadRequestException('This repair is finished; start a new request instead');
    }
    // Drivers can never write carrier-only notes
    const internal = actor.role === 'CARRIER' && !!dto.internal;
    await this.addEvent(actor, id, { action: 'COMMENT', note: dto.note.trim(), visibility: internal ? 'INTERNAL' : 'PUBLIC' });

    // A driver answering "needs more information" puts the request back in the carrier's queue
    if (actor.role === 'DRIVER' && r.status === 'NEEDS_INFO') {
      await this.prisma.repair.update({ where: { id }, data: { status: 'SUBMITTED' } });
      await this.addEvent(actor, id, { action: 'STATUS', fromStatus: 'NEEDS_INFO', toStatus: 'SUBMITTED' });
    }
    if (actor.role === 'DRIVER') this.notify('Driver replied on a repair', `${r.title} (${r.truckName})`, r.truckId || undefined);
    return this.get(actor, id);
  }

  async cancel(actor: RepairActor, id: string) {
    const r = await this.loadForActor(actor, id);
    if (actor.role === 'DRIVER' && !['SUBMITTED', 'NEEDS_INFO'].includes(r.status)) {
      throw new BadRequestException('You can only cancel a request that has not been scheduled yet');
    }
    if (actor.role === 'CARRIER' && !(CARRIER_TRANSITIONS[r.status] || []).includes('CANCELLED')) {
      throw new BadRequestException(`A ${r.status.toLowerCase()} repair cannot be cancelled`);
    }
    await this.prisma.repair.update({ where: { id }, data: { status: 'CANCELLED' } });
    await this.addEvent(actor, id, { action: 'STATUS', fromStatus: r.status, toStatus: 'CANCELLED', note: 'Cancelled' });
    return this.get(actor, id);
  }

  /** Driver says the truck is fixed, or that the problem is still there. */
  async confirm(actor: RepairActor, id: string, dto: ConfirmRepairDto) {
    if (actor.role !== 'DRIVER') throw new ForbiddenException('Only the driver can confirm a repair');
    const r = await this.loadForActor(actor, id);
    if (r.status !== 'COMPLETED') throw new BadRequestException('This repair is not waiting for your confirmation');
    if (!this.canDriverConfirm(r)) {
      throw new BadRequestException(`The ${DRIVER_CONFIRM_WINDOW_DAYS}-day window to respond has passed; please report a new problem`);
    }
    const comment = dto.comment?.trim();
    if (dto.result === 'NOT_FIXED' && !comment) throw new BadRequestException('Tell us what is still wrong');

    const to = dto.result === 'OK' ? 'VERIFIED' : 'REOPENED';
    await this.prisma.repair.update({
      where: { id },
      data: {
        status: to,
        driverResult: dto.result,
        driverComment: comment || null,
        driverConfirmedAt: new Date(),
        completedAt: dto.result === 'OK' ? r.completedAt : null,
      },
    });
    await this.addEvent(actor, id, {
      action: 'CONFIRMED',
      fromStatus: 'COMPLETED',
      toStatus: to,
      note: dto.result === 'OK' ? comment || 'Driver confirmed the truck is fixed' : `Not fixed: ${comment}`,
    });
    this.notify(
      dto.result === 'OK' ? 'Driver confirmed repair' : 'Repair reopened by driver',
      `${r.title} (${r.truckName})`,
      r.truckId || undefined,
    );
    return this.get(actor, id);
  }

  async setPayment(actor: RepairActor, id: string, dto: PaymentRepairDto) {
    this.requireCarrier(actor);
    const r = await this.loadForActor(actor, id);
    if (!['COMPLETED', 'VERIFIED', 'CLOSED'].includes(r.status)) {
      throw new BadRequestException('Payment can only be recorded once the repair is complete');
    }
    await this.prisma.repair.update({
      where: { id },
      data: { paymentStatus: dto.paid ? 'PAID' : 'UNPAID', paidAt: dto.paid ? new Date() : null },
    });
    await this.addEvent(actor, id, {
      action: 'PAYMENT',
      note: dto.paid ? 'Marked as paid' : 'Marked as unpaid',
      visibility: 'INTERNAL',
    });
    return this.get(actor, id);
  }
}
