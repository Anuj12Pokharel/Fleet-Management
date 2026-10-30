import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { PrismaService } from '../prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../enums';
import { NotificationsService } from '../notifications/notifications.service';
import { computeClocks } from '../hos/hos.controller';

const DAY = 24 * 60 * 60 * 1000;

// States that require special permits
const PERMIT_STATES = ['NM', 'KY', 'NY', 'OR', 'CT', 'WV', 'AR', 'KS'] as const;
type PermitState = typeof PERMIT_STATES[number];

const PERMIT_STATE_NOTES: Record<PermitState, string> = {
  NM: 'New Mexico Weight Distance Tax – Quarterly report required',
  KY: 'Kentucky Weight Distance Tax – Report KY Miles every entry',
  NY: 'NY HUT (Highway Use Tax) – Quarterly mileage report required',
  OR: 'Oregon Weight-Mile Tax – Trip permit or account required',
  CT: 'Connecticut Mileage Tax – Quarterly filing required',
  WV: 'West Virginia Weight Fee – Quarterly filing required',
  AR: 'Arkansas Third Structure Tax – Annual or trip permit required',
  KS: 'Kansas Mileage Tax – Quarterly filing required',
};

function daysUntil(date: Date | null | undefined): number | null {
  if (!date) return null;
  return Math.ceil((new Date(date).getTime() - Date.now()) / DAY);
}

function urgency(days: number | null): 'OK' | 'WARNING' | 'CRITICAL' | 'EXPIRED' | 'UNKNOWN' {
  if (days === null) return 'UNKNOWN';
  if (days < 0) return 'EXPIRED';
  if (days <= 5) return 'CRITICAL';
  if (days <= 30) return 'WARNING';
  return 'OK';
}

@ApiTags('Compliance')
@ApiBearerAuth('JWT-Auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.MAINTENANCE_ADMIN, Role.FLEET_MANAGER)
@Controller('api/compliance')
export class ComplianceController {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  /**
   * Full compliance dashboard — all checks in one response.
   */
  @Get('dashboard')
  @ApiOperation({ summary: 'Complete compliance dashboard summary', description: 'Aggregates driver compliance (CDL, Med Card, HOS violations), vehicle inspections, fleet COI documents, and special state permit alerts.' })
  @ApiResponse({ status: 200, description: 'Compliance dashboard data.' })
  async dashboard() {
    const now = Date.now();
    const fiveDaysAgo = new Date(now - 5 * DAY);
    const nineDaysAgo = new Date(now - 9 * DAY);

    const [contacts, assets, renewals, hosLogs, documents] = await Promise.all([
      this.prisma.contact.findMany({ where: { role: 'DRIVER' } }),
      this.prisma.asset.findMany(),
      this.prisma.renewalAlert.findMany({ include: { asset: true } }),
      this.prisma.hosLog.findMany({
        where: { startedAt: { gte: nineDaysAgo } },
        orderBy: { startedAt: 'asc' },
      }),
      this.prisma.fleetDocument.findMany(),
    ]);

    // ── DRIVER COMPLIANCE ──────────────────────────────────────────────────

    const driverCompliance = contacts
      .filter(c => c.role === 'DRIVER')
      .map(driver => {
        const cdlDays = daysUntil(driver.cdlExpiry);
        const medDays = daysUntil(driver.medCardExpiry);

        // HOS violations for this driver in last 5 days
        const driverLogs = hosLogs.filter(h => h.driverId === driver.userId || h.driverId === driver.id);
        const fiveDayLogs = driverLogs.filter(h => h.startedAt >= fiveDaysAgo);
        const hosClocks = fiveDayLogs.length > 0 ? computeClocks(fiveDayLogs) : null;
        const hosViolations = hosClocks?.violations ?? [];

        return {
          id: driver.id,
          driverId: driver.userId,
          name: driver.name,
          phone: driver.phone,
          email: driver.email,
          cdl: {
            number: driver.cdlNumber,
            expiry: driver.cdlExpiry,
            daysLeft: cdlDays,
            urgency: urgency(cdlDays),
          },
          medicalCert: {
            expiry: driver.medCardExpiry,
            daysLeft: medDays,
            urgency: urgency(medDays),
          },
          hos: {
            violations: hosViolations,
            hasViolation: hosViolations.length > 0,
            status: hosViolations.length > 0 ? 'VIOLATION' : 'CLEAN',
            driveMinutesLeft: hosClocks?.driveMinutesLeft ?? null,
            shiftMinutesLeft: hosClocks?.shiftMinutesLeft ?? null,
            cycleMinutesLeft: hosClocks?.cycleMinutesLeft ?? null,
          },
        };
      });

    // ── VEHICLE COMPLIANCE ─────────────────────────────────────────────────

    const tractors = assets.filter(a => a.type === 'TRACTOR');
    const trailers = assets.filter(a => a.type === 'TRAILER');

    // Map renewals by assetId + type for quick lookup
    const renewalMap = new Map<string, any[]>();
    for (const r of renewals) {
      const key = `${r.assetId}:${r.type}`;
      if (!renewalMap.has(key)) renewalMap.set(key, []);
      renewalMap.get(key)!.push(r);
    }

    function getLatestRenewal(assetId: string, type: string) {
      const items = renewalMap.get(`${assetId}:${type}`) || [];
      if (!items.length) return null;
      return items.sort((a, b) => new Date(b.expiryDate).getTime() - new Date(a.expiryDate).getTime())[0];
    }

    const vehicleCompliance = assets.map(asset => {
      const annualInspection = getLatestRenewal(asset.id, 'DOT_ANNUAL_INSPECTION');
      const iftaDecal = getLatestRenewal(asset.id, 'IFTA_DECAL');
      const dotDecal = getLatestRenewal(asset.id, 'DOT_DECAL');
      const coi = getLatestRenewal(asset.id, 'INSURANCE_POLICY');

      const annualDays = annualInspection ? daysUntil(annualInspection.expiryDate) : null;
      const iftaDays = iftaDecal ? daysUntil(iftaDecal.expiryDate) : null;
      const coiDays = coi ? daysUntil(coi.expiryDate) : null;

      return {
        id: asset.id,
        name: asset.name,
        type: asset.type,
        vin: asset.vin,
        plateNumber: asset.plateNumber,
        status: asset.status,
        annualInspection: {
          record: annualInspection,
          expiryDate: annualInspection?.expiryDate ?? null,
          daysLeft: annualDays,
          urgency: urgency(annualDays),
        },
        iftaDecal: {
          record: iftaDecal,
          expiryDate: iftaDecal?.expiryDate ?? null,
          daysLeft: iftaDays,
          urgency: urgency(iftaDays),
          note: 'Must be affixed to both sides of tractor',
        },
        dotDecal: {
          record: dotDecal,
          hasDecal: !!dotDecal,
          note: 'Must be affixed to both sides of tractor',
        },
        coi: {
          record: coi,
          expiryDate: coi?.expiryDate ?? null,
          daysLeft: coiDays,
          urgency: urgency(coiDays),
        },
      };
    });

    // ── FLEET-WIDE DOCUMENTS (COI, Authority, IFTA) ───────────────────────

    const fleetDocs = documents
      .filter(d => ['INSURANCE_CARD', 'REGISTRATION', 'INSPECTION_CERT', 'OTHER'].includes(d.type))
      .map(doc => {
        const days = daysUntil(doc.expiresAt);
        return {
          id: doc.id,
          name: doc.name,
          type: doc.type,
          fileUrl: doc.fileUrl,
          expiresAt: doc.expiresAt,
          daysLeft: days,
          urgency: urgency(days),
        };
      });

    // ── STATE PERMIT FLAGS ─────────────────────────────────────────────────

    const statePermits = PERMIT_STATES.map(state => ({
      state,
      notes: PERMIT_STATE_NOTES[state],
      requiresPermit: true,
      flagged: ['KY'].includes(state), // KY always requires mile reporting
      reportKYMiles: state === 'KY',
    }));

    // ── SUMMARY STATS ─────────────────────────────────────────────────────

    const driverAlerts = driverCompliance.reduce((count, d) => {
      if (d.cdl.urgency === 'CRITICAL' || d.cdl.urgency === 'EXPIRED') count++;
      if (d.medicalCert.urgency === 'CRITICAL' || d.medicalCert.urgency === 'EXPIRED') count++;
      if (d.hos.hasViolation) count++;
      return count;
    }, 0);

    const vehicleAlerts = vehicleCompliance.reduce((count, v) => {
      if (v.annualInspection.urgency === 'CRITICAL' || v.annualInspection.urgency === 'EXPIRED') count++;
      if (v.coi.urgency === 'CRITICAL' || v.coi.urgency === 'EXPIRED') count++;
      return count;
    }, 0);

    const totalAlerts = driverAlerts + vehicleAlerts;
    const overallStatus = totalAlerts === 0 ? 'COMPLIANT' : totalAlerts <= 3 ? 'AT_RISK' : 'NON_COMPLIANT';

    return {
      generatedAt: new Date().toISOString(),
      summary: {
        overallStatus,
        totalAlerts,
        driverAlerts,
        vehicleAlerts,
        driversChecked: driverCompliance.length,
        vehiclesChecked: vehicleCompliance.length,
      },
      drivers: driverCompliance,
      vehicles: vehicleCompliance,
      fleetDocuments: fleetDocs,
      statePermits,
    };
  }

  /**
   * Send a photo request notification to a driver (for tires or truck appearance).
   */
  @Post('photo-request')
  @ApiOperation({ summary: 'Request vehicle inspection photo from driver', description: 'Dispatches notification to mobile driver app to capture tire tread depth or vehicle cleanliness photos.' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['driverId', 'type', 'assetId'],
      properties: {
        driverId: { type: 'string', example: 'driver_bob' },
        type: { type: 'string', enum: ['TIRE', 'TRUCK_APPEARANCE'], example: 'TIRE' },
        assetId: { type: 'string', example: 'asset_123' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Photo request dispatched.' })
  async requestPhoto(
    @Body('driverId') driverId: string,
    @Body('type') type: 'TIRE' | 'TRUCK_APPEARANCE',
    @Body('assetId') assetId: string,
  ) {
    const driver = await this.prisma.contact.findFirst({
      where: { OR: [{ id: driverId }, { userId: driverId }] },
    });

    const asset = await this.prisma.asset.findUnique({ where: { id: assetId } });

    const label = type === 'TIRE' ? 'tire tread' : 'truck appearance';
    const message = type === 'TIRE'
      ? `Please send a photo of your current tire tread for ${asset?.name || assetId}. Tread depth must be within legal limits.`
      : `Please send a current photo of ${asset?.name || assetId} (exterior cleanliness check). Trucks should be washed every 1-2 months.`;

    this.notificationsService.emit({
      type: 'COMPLIANCE',
      title: `📷 Photo Request: ${label} — ${asset?.name || assetId}`,
      message,
      assetId,
      timestamp: new Date().toISOString(),
    });

    return {
      sent: true,
      driverName: driver?.name ?? driverId,
      assetName: asset?.name ?? assetId,
      type,
      message,
      sentAt: new Date().toISOString(),
    };
  }

  /**
   * Get all state permit requirements and current KY mileage status.
   */
  @Get('permits')
  @ApiOperation({ summary: 'List state-specific permit rules', description: 'Returns weight-distance tax regulations for NM, KY, NY, OR, CT, WV, AR, KS.' })
  @ApiResponse({ status: 200, description: 'State permits requirements list.' })
  async getPermits() {
    return PERMIT_STATES.map(state => ({
      state,
      notes: PERMIT_STATE_NOTES[state],
      requiresPermit: true,
      reportKYMiles: state === 'KY',
      flaggedOnEntry: true,
    }));
  }

  /**
   * Log KY miles entry for IFTA reporting.
   */
  @Post('ky-miles')
  @ApiOperation({ summary: 'Log Kentucky weight-distance miles', description: 'Records KY state mileage on entry for quarterly KYU tax filing.' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['assetId', 'miles'],
      properties: {
        assetId: { type: 'string', example: 'asset_123' },
        miles: { type: 'number', example: 125.4 },
        date: { type: 'string', format: 'date-time', example: '2026-10-29T10:00:00Z' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'KY miles recorded.' })
  async logKYMiles(
    @Req() req: any,
    @Body('assetId') assetId: string,
    @Body('miles') miles: number,
    @Body('date') date?: string,
  ) {
    // Store as an expense record tagged to KY for IFTA tracking
    const record = await this.prisma.expenseRecord.create({
      data: {
        assetId,
        category: 'OTHER',
        amount: 0,
        description: `KY Weight Distance Miles: ${miles} miles`,
        date: date ? new Date(date) : new Date(),
        linkedWoId: null,
      },
    });

    this.notificationsService.emit({
      type: 'COMPLIANCE',
      title: `KY Miles Logged — ${miles} mi`,
      message: `Kentucky weight-distance miles recorded for IFTA reporting: ${miles} miles`,
      assetId,
      timestamp: new Date().toISOString(),
    });

    return { logged: true, miles, record };
  }
}
