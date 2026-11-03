import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { IsOptional, IsString, IsNumber, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ComplianceScope, VerificationStatus, Role } from '../enums';

export class SaveRenewalDto {
  @IsOptional() @IsString()
  id?: string;

  @IsOptional() @IsString()
  scope?: 'DRIVER' | 'EQUIPMENT' | 'CARRIER';

  @IsOptional() @IsString()
  type?: string;

  @IsOptional() @IsString()
  title?: string;

  @IsOptional() @IsString()
  description?: string;

  @IsOptional() @IsString()
  driverId?: string;

  @IsOptional() @IsString()
  assetId?: string;

  @IsOptional() @IsString()
  issueDate?: string;

  @IsOptional() @IsString()
  expiryDate?: string | null;

  @IsOptional() @Type(() => Number) @IsNumber()
  alertLeadDays?: number;

  @IsOptional() @Type(() => Number) @IsNumber()
  targetMileage?: number;

  @IsOptional() @IsString()
  lastRecordedDate?: string;

  @IsOptional() @IsString()
  referenceNumber?: string;

  @IsOptional() @IsString()
  documentUrl?: string;

  @IsOptional() @IsString()
  notes?: string;

  @IsOptional() @IsString()
  metadataJson?: string;

  @IsOptional() @IsString()
  verificationStatus?: string;
}

@Injectable()
export class RenewalsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Calculate urgency level and days left based on expiration date
   */
  calcUrgency(expiryDate: Date | null | undefined): { daysLeft: number | null; urgency: 'CRITICAL' | 'WARNING' | 'INFO' | 'OK' | 'NO_EXPIRY' } {
    if (!expiryDate) {
      return { daysLeft: null, urgency: 'NO_EXPIRY' };
    }
    const diffMs = new Date(expiryDate).getTime() - Date.now();
    const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) return { daysLeft, urgency: 'CRITICAL' };
    if (daysLeft <= 7) return { daysLeft, urgency: 'CRITICAL' };
    if (daysLeft <= 15) return { daysLeft, urgency: 'WARNING' };
    if (daysLeft <= 30) return { daysLeft, urgency: 'INFO' };
    return { daysLeft, urgency: 'OK' };
  }

  /**
   * Mileage-based urgency (PM service): miles remaining until targetMileage vs the unit's odometer.
   */
  calcMileageUrgency(
    targetMileage: number | null | undefined,
    odometer: number | null | undefined,
    alertLeadMiles = 1500,
  ): { mileageLeft: number | null; urgency: 'CRITICAL' | 'WARNING' | 'INFO' | 'OK' | 'NO_EXPIRY' } {
    if (!targetMileage || odometer === null || odometer === undefined) {
      return { mileageLeft: null, urgency: 'NO_EXPIRY' };
    }
    const mileageLeft = Math.round(targetMileage - odometer);
    if (mileageLeft <= 500) return { mileageLeft, urgency: 'CRITICAL' };
    if (mileageLeft <= alertLeadMiles) return { mileageLeft, urgency: 'WARNING' };
    return { mileageLeft, urgency: 'OK' };
  }

  /** Most severe of several urgency levels (NO_EXPIRY ranks lowest). */
  private worstUrgency(...levels: string[]): 'CRITICAL' | 'WARNING' | 'INFO' | 'OK' | 'NO_EXPIRY' {
    const rank: Record<string, number> = { CRITICAL: 4, WARNING: 3, INFO: 2, OK: 1, NO_EXPIRY: 0 };
    return levels.reduce((a, b) => (rank[b] > rank[a] ? b : a)) as any;
  }

  /**
   * Get all renewals with filtering, urgency calculation, and entity joins
   */
  async findAll(filters: {
    scope?: string;
    driverId?: string;
    assetId?: string;
    status?: string;
    verificationStatus?: string;
    search?: string;
  }) {
    const where: any = {};
    if (filters.scope) where.scope = filters.scope;
    if (filters.driverId) where.driverId = filters.driverId;
    if (filters.assetId) where.assetId = filters.assetId;
    if (filters.status) where.status = filters.status;
    if (filters.verificationStatus) where.verificationStatus = filters.verificationStatus;

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search } },
        { description: { contains: filters.search } },
        { referenceNumber: { contains: filters.search } },
      ];
    }

    // Auto-seed baseline items on first run if table is empty
    const totalCount = await (this.prisma as any).complianceRenewal.count();
    if (totalCount === 0) {
      await this.seedBaselineRenewals();
    }

    const items = await (this.prisma as any).complianceRenewal.findMany({
      where,
      include: {
        driver: { select: { id: true, name: true, email: true, role: true } },
        asset: { select: { id: true, name: true, plateNumber: true, vin: true, type: true, odometer: true } },
      },
      orderBy: [
        { expiryDate: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    return items.map((item: any) => {
      const { daysLeft, urgency: dateUrgency } = this.calcUrgency(item.expiryDate);
      const meta = this.parseMeta(item.metadataJson);
      const currentOdometer: number | null = item.asset?.odometer ?? null;
      const leadMiles = Number(meta.details?.alertLeadMiles) || 1500;
      const { mileageLeft, urgency: mileageUrgency } = this.calcMileageUrgency(
        item.targetMileage,
        currentOdometer,
        leadMiles,
      );
      const urgency = this.worstUrgency(dateUrgency, mileageUrgency);
      return {
        ...item,
        daysLeft,
        urgency,
        currentOdometer,
        mileageLeft,
        // Drivers selected from the SuperTruck carrier DB are kept in metadata (no local User FK)
        driverId: item.driverId || meta.driverRef?.id || null,
        driverName: item.driver?.name || meta.driverRef?.name || null,
        assetName: item.asset?.name || meta.componentRef?.assetName || meta.assetRef?.name || null,
        componentId: meta.componentRef?.id || null,
        componentName: meta.componentRef?.name || null,
        carrierId: meta.carrierRef?.id || null,
        carrierName: meta.carrierRef?.name || null,
        dotNumber: meta.carrierRef?.dotNumber || null,
      };
    });
  }

  private parseMeta(json?: string | null): any {
    if (!json) return {};
    try {
      const parsed = JSON.parse(json);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }

  /**
   * Only keep driverId / assetId when they exist locally, so external
   * (SuperTruck carrier DB) IDs never violate the fleet DB foreign keys.
   */
  private async resolveLocalRefs(dto: SaveRenewalDto): Promise<{ driverId: string | null; assetId: string | null }> {
    let driverId: string | null = null;
    let assetId: string | null = null;
    if (dto.driverId) {
      const u = await this.prisma.user.findUnique({ where: { id: dto.driverId }, select: { id: true } });
      driverId = u ? u.id : null;
    }
    if (dto.assetId) {
      const a = await this.prisma.asset.findUnique({ where: { id: dto.assetId }, select: { id: true } });
      assetId = a ? a.id : null;
    }
    return { driverId, assetId };
  }

  /**
   * If the driver comes from the SuperTruck carrier DB (not a local User),
   * keep its id in metadata so the record stays linked to that driver.
   */
  private withExternalDriverRef(dto: SaveRenewalDto, localDriverId: string | null): string | null {
    if (!dto.driverId || localDriverId) return dto.metadataJson || null;
    const meta = this.parseMeta(dto.metadataJson);
    if (meta.driverRef?.id !== dto.driverId) {
      meta.driverRef = { id: dto.driverId, name: meta.driverRef?.name || null };
    }
    return JSON.stringify(meta);
  }

  /**
   * Searchable truck/trailer lookup (first step of the Equipment form)
   */
  async lookupAssets(search?: string) {
    const term = search?.trim();
    const where: any = term
      ? {
          OR: [
            { name: { contains: term } },
            { vin: { contains: term } },
            { plateNumber: { contains: term } },
          ],
        }
      : {};
    const assets = await this.prisma.asset.findMany({
      where,
      select: { id: true, name: true, type: true, vin: true, plateNumber: true, odometer: true },
      orderBy: [{ name: 'asc' }],
      take: 50,
    });
    return assets.map((a: any) => ({
      id: a.id,
      name: a.name,
      type: a.type,
      vin: a.vin || null,
      plateNumber: a.plateNumber || null,
      odometer: a.odometer ?? null,
    }));
  }

  /**
   * Searchable component lookup (Engine, Brakes, Tyres...) with parent unit
   */
  async lookupComponents(search?: string, assetId?: string) {
    const term = search?.trim();
    const where: any = term
      ? {
          OR: [
            { name: { contains: term } },
            { asset: { name: { contains: term } } },
            { asset: { vin: { contains: term } } },
            { asset: { plateNumber: { contains: term } } },
          ],
        }
      : {};
    // Restrict to the components of one truck/trailer
    if (assetId) where.assetId = assetId;
    const comps = await this.prisma.component.findMany({
      where,
      include: { asset: { select: { id: true, name: true, type: true, vin: true, plateNumber: true } } },
      orderBy: [{ name: 'asc' }],
      take: 50,
    });
    return comps.map((c: any) => ({
      id: c.id,
      name: c.name,
      status: c.status,
      assetId: c.assetId,
      assetName: c.asset?.name || null,
      assetType: c.asset?.type || null,
      vin: c.asset?.vin || null,
      plateNumber: c.asset?.plateNumber || null,
    }));
  }

  /**
   * Summary counts across all 33 items
   */
  async getSummary() {
    const all = await this.findAll({});
    const total = all.length;
    const criticalOverdue = all.filter((r: any) => r.urgency === 'CRITICAL').length;
    const warning30d = all.filter((r: any) => r.urgency === 'WARNING' || (r.daysLeft !== null && r.daysLeft <= 30 && r.daysLeft > 7)).length;
    const upcoming60d = all.filter((r: any) => r.daysLeft !== null && r.daysLeft > 30 && r.daysLeft <= 60).length;
    const healthy = all.filter((r: any) => r.urgency === 'OK' || r.urgency === 'NO_EXPIRY').length;
    const pendingVerification = all.filter((r: any) => r.verificationStatus === 'PENDING_VERIFICATION').length;

    const driverCount = all.filter((r: any) => r.scope === 'DRIVER').length;
    const equipmentCount = all.filter((r: any) => r.scope === 'EQUIPMENT').length;
    const carrierCount = all.filter((r: any) => r.scope === 'CARRIER').length;

    return {
      total,
      criticalOverdue,
      warning30d,
      upcoming60d,
      healthy,
      pendingVerification,
      driverCount,
      equipmentCount,
      carrierCount,
    };
  }

  /**
   * Fleet Manager Master Save (Add or Edit ANY item across Driver, Equipment, Carrier)
   */
  async masterSave(user: any, dto: SaveRenewalDto) {
    // Validate required fields
    if (!dto.scope) throw new BadRequestException('scope is required (DRIVER, EQUIPMENT, or CARRIER)');
    if (!dto.type) throw new BadRequestException('type is required (e.g. DRIVER_CDL)');
    if (!dto.title) throw new BadRequestException('title is required');

    const isEdit = Boolean(dto.id);
    const expiry = dto.expiryDate ? new Date(dto.expiryDate as string) : null;
    const issue = dto.issueDate ? new Date(dto.issueDate as string) : null;
    const lastRec = dto.lastRecordedDate ? new Date(dto.lastRecordedDate as string) : null;
    const refs = await this.resolveLocalRefs(dto);
    const metadataJson = this.withExternalDriverRef(dto, refs.driverId);

    if (isEdit && dto.id) {
      const existing = await (this.prisma as any).complianceRenewal.findUnique({ where: { id: dto.id } });
      if (!existing) throw new NotFoundException('Renewal record not found');

      return (this.prisma as any).complianceRenewal.update({
        where: { id: dto.id },
        data: {
          scope: dto.scope,
          type: dto.type,
          title: dto.title,
          description: dto.description || null,
          driverId: refs.driverId,
          assetId: refs.assetId,
          issueDate: issue,
          expiryDate: expiry,
          alertLeadDays: dto.alertLeadDays ?? 30,
          targetMileage: dto.targetMileage ? Number(dto.targetMileage) : null,
          lastRecordedDate: lastRec,
          referenceNumber: dto.referenceNumber || null,
          documentUrl: dto.documentUrl || existing.documentUrl,
          notes: dto.notes || null,
          metadataJson,
          lastModifiedById: user.id,
          lastModifiedByName: user.name,
          lastModifiedByRole: user.role,
          verificationStatus: dto.verificationStatus || 'VERIFIED',
          verifiedById: user.id,
          verifiedByName: user.name,
          verifiedAt: new Date(),
        },
        include: { driver: true, asset: true },
      });
    }

    // Direct Add by Fleet Manager / Maintenance Admin
    return (this.prisma as any).complianceRenewal.create({
      data: {
        scope: dto.scope,
        type: dto.type,
        title: dto.title,
        description: dto.description || null,
        driverId: refs.driverId,
        assetId: refs.assetId,
        issueDate: issue,
        expiryDate: expiry,
        alertLeadDays: dto.alertLeadDays ?? 30,
        targetMileage: dto.targetMileage ? Number(dto.targetMileage) : null,
        lastRecordedDate: lastRec,
        referenceNumber: dto.referenceNumber || null,
        documentUrl: dto.documentUrl || null,
        notes: dto.notes || null,
        metadataJson,
        enteredById: user.id,
        enteredByName: user.name,
        enteredByRole: user.role,
        verificationStatus: 'VERIFIED',
        verifiedById: user.id,
        verifiedByName: user.name,
        verifiedAt: new Date(),
      },
      include: { driver: true, asset: true },
    });
  }

  /**
   * Driver Self-Service Submission (Submits CDL, Med Cert, TWIC, etc.)
   */
  async driverSubmit(user: any, dto: Partial<SaveRenewalDto>) {
    const expiry = dto.expiryDate ? new Date(dto.expiryDate) : null;
    const issue = dto.issueDate ? new Date(dto.issueDate) : null;

    return (this.prisma as any).complianceRenewal.create({
      data: {
        scope: 'DRIVER',
        type: dto.type || 'DRIVER_CDL',
        title: dto.title || 'Driver Credential Submission',
        description: dto.description || `Submitted by driver ${user.name}`,
        driverId: user.id,
        issueDate: issue,
        expiryDate: expiry,
        alertLeadDays: dto.alertLeadDays ?? 30,
        referenceNumber: dto.referenceNumber || null,
        documentUrl: dto.documentUrl || null,
        notes: dto.notes || null,
        metadataJson: dto.metadataJson || null,
        enteredById: user.id,
        enteredByName: user.name,
        enteredByRole: 'DRIVER',
        verificationStatus: 'PENDING_VERIFICATION',
      },
      include: { driver: true },
    });
  }

  /**
   * Mechanic Equipment Submission (Annual DOT, IFTA Decal, Form 2290, PM interval)
   */
  async equipmentSubmit(user: any, dto: Partial<SaveRenewalDto>) {
    if (!dto.assetId) throw new NotFoundException('Asset selection is required for equipment compliance');
    const expiry = dto.expiryDate ? new Date(dto.expiryDate) : null;
    const issue = dto.issueDate ? new Date(dto.issueDate) : new Date();

    return (this.prisma as any).complianceRenewal.create({
      data: {
        scope: 'EQUIPMENT',
        type: dto.type || 'EQUIPMENT_DOT_ANNUAL_INSPECTION',
        title: dto.title || 'Equipment Compliance Log',
        description: dto.description || `Certified by mechanic ${user.name}`,
        assetId: dto.assetId,
        issueDate: issue,
        expiryDate: expiry,
        alertLeadDays: dto.alertLeadDays ?? 30,
        targetMileage: dto.targetMileage ? Number(dto.targetMileage) : null,
        referenceNumber: dto.referenceNumber || null,
        documentUrl: dto.documentUrl || null,
        notes: dto.notes || null,
        metadataJson: dto.metadataJson || null,
        enteredById: user.id,
        enteredByName: user.name,
        enteredByRole: user.role,
        verificationStatus: 'VERIFIED',
        verifiedById: user.id,
        verifiedByName: user.name,
        verifiedAt: new Date(),
      },
      include: { asset: true },
    });
  }

  /**
   * Manager Verification Engine (Approve or Reject)
   */
  async verifyRenewal(user: any, id: string, approved: boolean, notes?: string) {
    const existing = await (this.prisma as any).complianceRenewal.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Record not found');

    return (this.prisma as any).complianceRenewal.update({
      where: { id },
      data: {
        verificationStatus: approved ? 'VERIFIED' : 'REJECTED',
        verifiedById: user.id,
        verifiedByName: user.name,
        verifiedAt: new Date(),
        rejectionReason: approved ? null : (notes || 'Rejected by Fleet Manager'),
        notes: notes ? (existing.notes ? `${existing.notes}\n[Review Note]: ${notes}` : `[Review Note]: ${notes}`) : existing.notes,
      },
      include: { driver: true, asset: true },
    });
  }

  /**
   * Fleet Manager Delete / Archive
   */
  async deleteRenewal(user: any, id: string) {
    return (this.prisma as any).complianceRenewal.delete({
      where: { id },
    });
  }

  /**
   * Auto-seed realistic baseline compliance records across all 33 categories
   */
  async seedBaselineRenewals() {
    const driver = await this.prisma.user.findFirst({ where: { role: Role.DRIVER } });
    const asset = await this.prisma.asset.findFirst();
    const admin = await this.prisma.user.findFirst({
      where: { role: { in: [Role.FLEET_MANAGER, Role.MAINTENANCE_ADMIN] } },
    });

    const adminId = admin?.id || 'admin-system';
    const adminName = admin?.name || 'Fleet Administrator';
    const driverId = driver?.id || null;
    const assetId = asset?.id || null;

    const addDays = (d: number) => {
      const dt = new Date();
      dt.setDate(dt.getDate() + d);
      return dt;
    };

    const initialItems = [
      // ── DRIVER (9 items) ──
      {
        scope: 'DRIVER',
        type: 'DRIVER_CDL',
        title: 'CDL (Commercial Driver License)',
        description: 'Valid Texas Class A Commercial Driver License with Doubles/Triples and Air Brakes.',
        driverId,
        referenceNumber: 'TX-CDL-8841092',
        issueDate: addDays(-730),
        expiryDate: addDays(45), // Warning horizon
        alertLeadDays: 60,
        verificationStatus: 'VERIFIED',
      },
      {
        scope: 'DRIVER',
        type: 'DRIVER_MEDICAL_CARD',
        title: 'Medical Certificate Active (MCSA-5876)',
        description: 'Certified Medical Examiner Certificate issued under NRCME protocol.',
        driverId,
        referenceNumber: 'NRCME-994102',
        issueDate: addDays(-700),
        expiryDate: addDays(12), // Action Needed
        alertLeadDays: 30,
        verificationStatus: 'VERIFIED',
      },
      {
        scope: 'DRIVER',
        type: 'DRIVER_HOS_LOG',
        title: 'HOS Log (Hours of Service)',
        description: 'Motive ELD 70-hour / 8-day rolling cycle compliant. Zero duty status violations.',
        driverId,
        referenceNumber: 'Motive Cycle #401',
        issueDate: new Date(),
        expiryDate: addDays(6), // Critical / 7-day
        alertLeadDays: 7,
        verificationStatus: 'VERIFIED',
      },
      {
        scope: 'DRIVER',
        type: 'DRIVER_TWIC_CARD',
        title: 'TWIC Card',
        description: 'Transportation Worker Identification Credential for maritime port and rail terminal clearance.',
        driverId,
        referenceNumber: 'TWIC-882194',
        issueDate: addDays(-365),
        expiryDate: addDays(320),
        alertLeadDays: 60,
        verificationStatus: 'VERIFIED',
      },
      {
        scope: 'DRIVER',
        type: 'DRIVER_HAZMAT_ENDORSEMENT',
        title: 'HAZMAT or other Endorsement',
        description: 'Hazardous Materials (H) and Tanker (N) endorsements with active TSA threat assessment.',
        driverId,
        referenceNumber: 'TSA-CLEAR-8821',
        issueDate: addDays(-300),
        expiryDate: addDays(180),
        alertLeadDays: 60,
        verificationStatus: 'VERIFIED',
      },
      {
        scope: 'DRIVER',
        type: 'DRIVER_ANNUAL_CLEARINGHOUSE_QUERY',
        title: 'Annual Clearing House Query',
        description: 'FMCSA Drug & Alcohol Clearinghouse annual limited query returned Driver Not Prohibited.',
        driverId,
        referenceNumber: 'CH-QUERY-2026-01',
        issueDate: addDays(-330),
        expiryDate: addDays(35),
        alertLeadDays: 30,
        verificationStatus: 'VERIFIED',
      },
      {
        scope: 'DRIVER',
        type: 'DRIVER_ANNUAL_MVR_SELF_CERT',
        title: 'Annual MVR & Violations Certified by Driver',
        description: 'Driver signed 49 CFR § 391.27 certificate of violations confirming clean driving history.',
        driverId,
        referenceNumber: 'MVR-CERT-2026',
        issueDate: addDays(-350),
        expiryDate: addDays(15),
        alertLeadDays: 30,
        verificationStatus: 'VERIFIED',
      },
      {
        scope: 'DRIVER',
        type: 'DRIVER_PRE_EMPLOYMENT_DRUG_TEST',
        title: 'Pre-Employment Drug Test',
        description: 'Verified Negative 5-Panel DOT Urine Drug Screen prior to initial safety-sensitive dispatch.',
        driverId,
        referenceNumber: 'CCF Specimen #9948201',
        issueDate: addDays(-800),
        expiryDate: null, // Permanent / No Expiry
        alertLeadDays: 0,
        verificationStatus: 'VERIFIED',
      },
      {
        scope: 'DRIVER',
        type: 'DRIVER_RANDOM_DRUG_TEST',
        title: 'Random Drug Test Pool',
        description: 'Driver enrolled in active consortium pool. Last random pool test negative.',
        driverId,
        referenceNumber: 'Pool Consortium #PC-8821',
        issueDate: addDays(-42),
        expiryDate: addDays(48),
        alertLeadDays: 30,
        verificationStatus: 'VERIFIED',
      },

      // ── EQUIPMENT (8 items) ──
      {
        scope: 'EQUIPMENT',
        type: 'EQUIPMENT_TITLE',
        title: 'Equipment Title',
        description: 'Clean Texas Certificate of Title on file with carrier treasury.',
        assetId,
        referenceNumber: 'TX-TITLE-994182',
        issueDate: addDays(-1000),
        expiryDate: null, // Permanent / Optional
        alertLeadDays: 0,
        verificationStatus: 'VERIFIED',
      },
      {
        scope: 'EQUIPMENT',
        type: 'EQUIPMENT_REGISTRATION',
        title: 'Registration / Cab Card',
        description: 'Apportioned IRP 48-state cab card registration sticker valid for 80,000 lbs GVW.',
        assetId,
        referenceNumber: 'Plate #TX-P9942',
        issueDate: addDays(-300),
        expiryDate: addDays(65),
        alertLeadDays: 45,
        verificationStatus: 'VERIFIED',
      },
      {
        scope: 'EQUIPMENT',
        type: 'EQUIPMENT_COI',
        title: 'Vehicle Certificate of Insurance (COI)',
        description: 'Scheduled vehicle inclusion endorsement on primary commercial physical damage and auto liability.',
        assetId,
        referenceNumber: 'COI-VEH-8820',
        issueDate: addDays(-300),
        expiryDate: addDays(65),
        alertLeadDays: 30,
        verificationStatus: 'VERIFIED',
      },
      {
        scope: 'EQUIPMENT',
        type: 'EQUIPMENT_DOT_ANNUAL_INSPECTION',
        title: 'Annual Inspection (DOT § 396.17)',
        description: '49 CFR Part 396.17 Periodic Inspection completed by certified heavy-duty technician.',
        assetId,
        referenceNumber: 'Decal #DOT-2026-991',
        issueDate: addDays(-340),
        expiryDate: addDays(25), // Action needed
        alertLeadDays: 30,
        verificationStatus: 'VERIFIED',
      },
      {
        scope: 'EQUIPMENT',
        type: 'EQUIPMENT_IFTA_DECAL',
        title: 'Current FY IFTA Decal',
        description: '2026 International Fuel Tax Agreement pair affixed to both sides of tractor cab.',
        assetId,
        referenceNumber: 'Decal #26-884109',
        issueDate: addDays(-120),
        expiryDate: addDays(245),
        alertLeadDays: 45,
        verificationStatus: 'VERIFIED',
      },
      {
        scope: 'EQUIPMENT',
        type: 'EQUIPMENT_PM_SERVICE',
        title: 'Last PM & Next PM Mileage',
        description: 'PM B-Service scheduled interval for heavy-duty powertrain and fluid analysis.',
        assetId,
        referenceNumber: 'PM-B Service #402',
        issueDate: addDays(-60),
        expiryDate: addDays(30),
        targetMileage: 150000,
        alertLeadDays: 14,
        verificationStatus: 'VERIFIED',
      },
      {
        scope: 'EQUIPMENT',
        type: 'EQUIPMENT_LEASE_AGREEMENT',
        title: 'Lease Agreement',
        description: 'Master Equipment Operating Lease Agreement and Schedule A.',
        assetId,
        referenceNumber: 'Lease #PENSKE-8841',
        issueDate: addDays(-400),
        expiryDate: addDays(330),
        alertLeadDays: 30,
        verificationStatus: 'VERIFIED',
      },
      {
        scope: 'EQUIPMENT',
        type: 'EQUIPMENT_FORM_2290_HVUT',
        title: 'Latest Form 2290 (HVUT Schedule 1)',
        description: 'Heavy Vehicle Use Tax Schedule 1 watermarked e-file receipt for current tax year.',
        assetId,
        referenceNumber: 'IRS-EFILE-2026-2290',
        issueDate: addDays(-240),
        expiryDate: addDays(125), // Due Aug 31
        alertLeadDays: 45,
        verificationStatus: 'VERIFIED',
      },

      // ── CARRIER (16 items) ──
      {
        scope: 'CARRIER',
        type: 'CARRIER_OPERATING_AUTHORITY',
        title: 'Operating Authority',
        description: 'FMCSA Certificate of Public Convenience and Necessity (MC-984210 / USDOT 3881920). Active status.',
        referenceNumber: 'MC-984210 / USDOT 3881920',
        issueDate: addDays(-1200),
        expiryDate: addDays(400),
        alertLeadDays: 60,
        verificationStatus: 'VERIFIED',
      },
      {
        scope: 'CARRIER',
        type: 'CARRIER_IFTA_LICENSE',
        title: 'Master IFTA License',
        description: 'Master International Fuel Tax Agreement carrier operating license issued by Texas Comptroller.',
        referenceNumber: 'IFTA-TX-992014',
        issueDate: addDays(-120),
        expiryDate: addDays(245),
        alertLeadDays: 60,
        verificationStatus: 'VERIFIED',
      },
      {
        scope: 'CARRIER',
        type: 'CARRIER_STATE_ABC_PERMITS',
        title: 'Permits If Any (State Permit, ABC Permit)',
        description: 'Alcoholic Beverage Commission transit permit and state oversize blanket permits.',
        referenceNumber: 'ABC-PERMIT-44109',
        issueDate: addDays(-180),
        expiryDate: addDays(185),
        alertLeadDays: 30,
        verificationStatus: 'VERIFIED',
      },
      {
        scope: 'CARRIER',
        type: 'CARRIER_EIN',
        title: 'EIN (Employer Identification Number)',
        description: 'Federal Employer Identification Number issued by the IRS. Permanent tax ID.',
        referenceNumber: '12-3456789',
        issueDate: addDays(-2000),
        expiryDate: null, // Permanent / No Expiry
        alertLeadDays: 0,
        verificationStatus: 'VERIFIED',
      },
      {
        scope: 'CARRIER',
        type: 'CARRIER_STATE_REGISTRATION',
        title: 'State Corporate Registration',
        description: 'Certificate of Formation and active Good Standing status with Texas Secretary of State.',
        referenceNumber: 'SOS Entity #80291410',
        issueDate: addDays(-365),
        expiryDate: addDays(190),
        alertLeadDays: 60,
        verificationStatus: 'VERIFIED',
      },
      {
        scope: 'CARRIER',
        type: 'CARRIER_QUARTERLY_IFTA',
        title: 'Quarterly IFTA Tax Filing',
        description: 'Q1 2026 fuel tax return reconciliation and state tax clearance filing.',
        referenceNumber: '2026-Q1-IFTA-FILING',
        issueDate: addDays(-25),
        expiryDate: addDays(5), // Due end of month - CRITICAL
        alertLeadDays: 15,
        verificationStatus: 'VERIFIED',
      },
      {
        scope: 'CARRIER',
        type: 'CARRIER_MCS_150',
        title: 'MCS-150 (Biennial FMCSA Update)',
        description: 'Biennial motor carrier identification report update schedule with FMCSA.',
        referenceNumber: 'MCS150-CONF-99214',
        issueDate: addDays(-600),
        expiryDate: addDays(130),
        alertLeadDays: 60,
        verificationStatus: 'VERIFIED',
      },
      {
        scope: 'CARRIER',
        type: 'CARRIER_UCR',
        title: 'UCR (Unified Carrier Registration)',
        description: '2026 Unified Carrier Registration payment receipt for multi-vehicle interstate fleet.',
        referenceNumber: 'UCR-2026-99410',
        issueDate: addDays(-120),
        expiryDate: addDays(245),
        alertLeadDays: 45,
        verificationStatus: 'VERIFIED',
      },
      {
        scope: 'CARRIER',
        type: 'CARRIER_BOC_3',
        title: 'Process Agent (BOC-3 Filing)',
        description: 'Blanket designation of legal process agents in all 50 US jurisdictions active with FMCSA.',
        referenceNumber: 'National Registered Agents BOC-3',
        issueDate: addDays(-1000),
        expiryDate: null, // Permanent / Active
        alertLeadDays: 0,
        verificationStatus: 'VERIFIED',
      },
      {
        scope: 'CARRIER',
        type: 'CARRIER_SCAC',
        title: 'SCAC (Standard Carrier Alpha Code)',
        description: 'National Motor Freight Traffic Association SCAC code assignment certificate.',
        referenceNumber: 'SCAC: STAI',
        issueDate: addDays(-180),
        expiryDate: addDays(185),
        alertLeadDays: 45,
        verificationStatus: 'VERIFIED',
      },
      {
        scope: 'CARRIER',
        type: 'CARRIER_HAZMAT_CERTIFICATE',
        title: 'HAZMAT Certificate (PHMSA)',
        description: 'USDOT PHMSA Hazardous Materials Registration Certificate for transport of regulated commodities.',
        referenceNumber: 'PHMSA Reg #042926 550 098Y',
        issueDate: addDays(-120),
        expiryDate: addDays(245),
        alertLeadDays: 60,
        verificationStatus: 'VERIFIED',
      },
      {
        scope: 'CARRIER',
        type: 'CARRIER_STATE_WEIGHT_DISTANCE',
        title: 'State Weight-Distance Permits (NY HUT, NM WD, KY KYU, OR HWY)',
        description: 'Active weight-mile permits: NY HUT #882194, NM WD #9941, KY KYU #99420, OR HWY #8841.',
        referenceNumber: 'KYU: 99420 | NY HUT: 882194',
        issueDate: addDays(-90),
        expiryDate: addDays(55),
        alertLeadDays: 45,
        verificationStatus: 'VERIFIED',
      },
      {
        scope: 'CARRIER',
        type: 'CARRIER_AUTO_LIABILITY_INSURANCE',
        title: 'Auto / Commercial Public Liability',
        description: 'Primary commercial auto liability policy providing $1,000,000 Combined Single Limit (CSL).',
        referenceNumber: 'Policy #TRV-COMM-99214',
        issueDate: addDays(-300),
        expiryDate: addDays(65),
        alertLeadDays: 45,
        verificationStatus: 'VERIFIED',
      },
      {
        scope: 'CARRIER',
        type: 'CARRIER_MCS_90',
        title: 'Form MCS-90 Endorsement',
        description: 'Endorsement for Motor Carrier Policies of Insurance for Public Liability under Sections 29 and 30.',
        referenceNumber: 'MCS90-ATTACHED-TRV',
        issueDate: addDays(-300),
        expiryDate: addDays(65),
        alertLeadDays: 45,
        verificationStatus: 'VERIFIED',
      },
      {
        scope: 'CARRIER',
        type: 'CARRIER_CARGO_INSURANCE',
        title: 'Cargo Insurance Policy',
        description: 'Motor Truck Cargo coverage policy with $250,000 limit and standard reefer breakdown rider.',
        referenceNumber: 'Policy #CARGO-99210-CHUBB',
        issueDate: addDays(-300),
        expiryDate: addDays(65),
        alertLeadDays: 45,
        verificationStatus: 'VERIFIED',
      },
      {
        scope: 'CARRIER',
        type: 'CARRIER_IRP_ACCOUNT',
        title: 'IRP Master Account Renewal',
        description: 'International Registration Plan apportioned fleet account with Texas Department of Motor Vehicles.',
        referenceNumber: 'IRP Account #TX-IRP-9924',
        issueDate: addDays(-300),
        expiryDate: addDays(65),
        alertLeadDays: 60,
        verificationStatus: 'VERIFIED',
      },
    ];

    for (const item of initialItems) {
      await (this.prisma as any).complianceRenewal.create({
        data: {
          ...item,
          enteredById: adminId,
          enteredByName: adminName,
          enteredByRole: 'FLEET_MANAGER',
          verifiedById: adminId,
          verifiedByName: adminName,
          verifiedAt: new Date(),
        },
      });
    }
  }
}
