import { Controller, Get, Post, Body, Query, Headers, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiBody, ApiHeader } from '@nestjs/swagger';
import { PrismaService } from '../prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NotificationsService } from '../notifications/notifications.service';
import { RelayFuelService } from './relay-fuel.service';

// Configured diesel IFTA rates ($/gal). Approximate - update from the current IFTA rate matrix each quarter.
const IFTA_DIESEL_RATES: Record<string, number> = {
  TX: 0.20, NM: 0.21, OK: 0.19, LA: 0.20, AZ: 0.26, NV: 0.27, CA: 0.98,
  AR: 0.285, CO: 0.205, KS: 0.26, MO: 0.195, FL: 0.35, GA: 0.33, IL: 0.64, TN: 0.27,
};

@ApiTags('Fuel & Tolls')
@ApiBearerAuth('JWT-Auth')
@UseGuards(JwtAuthGuard)
@Controller('api')
export class FuelController {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private relayFuelService: RelayFuelService,
  ) {}

  // Real FUEL CARD Webhook Ingestion Gateway (WEX / Comdata / Fleet One)
  @Post('fuel/webhook')
  @ApiOperation({ summary: 'Ingest fuel card transaction (Webhook)', description: 'Ingests fuel transactions from card gateways (WEX, Comdata, Relay), updates asset odometer, computes MPG, and detects fuel theft anomalies.' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['assetId', 'cardTransactionId', 'gallons', 'cost', 'location', 'odometer'],
      properties: {
        assetId: { type: 'string', example: 'asset_123' },
        cardTransactionId: { type: 'string', example: 'WEX-8921-TX' },
        gallons: { type: 'number', example: 120.5 },
        cost: { type: 'number', example: 421.75 },
        location: { type: 'string', example: 'TX' },
        odometer: { type: 'number', example: 145200 },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Fuel transaction logged.' })
  async ingestFuelTransaction(
    @Body('assetId') assetId: string,
    @Body('cardTransactionId') cardTransactionId: string,
    @Body('gallons') gallons: number,
    @Body('cost') cost: number,
    @Body('location') location: string, // State, e.g. "TX"
    @Body('odometer') odometer: number,
  ) {
    // 1. Fetch previous fuel log to calculate MPG
    const lastLog = await this.prisma.fuelLog.findFirst({
      where: { assetId },
      orderBy: { odometer: 'desc' },
    });

    let mpg = 6.2; // default fallback average for class-8 trucks
    let isAnomaly = false;

    if (lastLog && odometer > lastLog.odometer) {
      const distance = odometer - lastLog.odometer;
      mpg = distance / gallons;

      // Class 8 trucks average between 5.5 and 7.5 MPG.
      // Flag anomalies if MPG is below 4.0 or above 10.0 (indicates siphoning, fuel leakage, or odometer errors)
      if (mpg < 4.0 || mpg > 10.0) {
        isAnomaly = true;
      }
    }

    const fuelLog = await this.prisma.fuelLog.create({
      data: {
        assetId,
        cardTransactionId,
        gallons,
        cost,
        location,
        odometer,
        mpg,
        isAnomaly,
      },
      include: { asset: true },
    });

    // Sync asset odometer
    await this.prisma.asset.update({
      where: { id: assetId },
      data: { odometer },
    });

    // Notify if anomaly flagged
    if (isAnomaly) {
      this.notificationsService.emit({
        type: 'COMPLIANCE',
        title: `Fuel MPG Anomaly: ${fuelLog.asset.name}`,
        message: `Calculated MPG: ${mpg.toFixed(1)} is outside standard parameters. Anomaly flagged for audit.`,
        assetId: assetId,
        timestamp: new Date().toISOString(),
      });
    }

    return fuelLog;
  }

  @Get('fuel/logs')
  @ApiOperation({ summary: 'List all fuel logs', description: 'Returns all logged fuel fill-ups with MPG calculations and anomaly flags.' })
  @ApiResponse({ status: 200, description: 'Fuel logs list returned.' })
  async getFuelLogs() {
    return this.prisma.fuelLog.findMany({
      include: { asset: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // IFTA Logs report grouped by jurisdiction (state)
  @Get('fuel/ifta')
  @ApiOperation({ summary: 'Jurisdiction fuel summary', description: 'Aggregates gallons and spending grouped by state jurisdiction for IFTA preparation.' })
  @ApiResponse({ status: 200, description: 'Jurisdiction aggregates returned.' })
  async getIftaReport() {
    const logs = await this.prisma.fuelLog.findMany({
      include: { asset: true },
    });

    // Group logs by state/jurisdiction
    const report: Record<string, { jurisdiction: string; totalGallons: number; totalCost: number; transactionsCount: number }> = {};
    
    logs.forEach(log => {
      if (!report[log.location]) {
        report[log.location] = {
          jurisdiction: log.location,
          totalGallons: 0,
          totalCost: 0,
          transactionsCount: 0,
        };
      }
      report[log.location].totalGallons += log.gallons;
      report[log.location].totalCost += log.cost;
      report[log.location].transactionsCount += 1;
    });

    return Object.values(report);
  }

  /**
   * Quarterly IFTA reconciliation from stored fuel logs.
   */
  @Get('fuel/ifta/quarterly')
  @ApiOperation({ summary: 'Quarterly IFTA tax reconciliation', description: 'Computes quarterly taxable gallons, net gallons, and net tax owed/refund across all jurisdictions based on IFTA tax rates.' })
  @ApiQuery({ name: 'year', required: false, example: '2026' })
  @ApiQuery({ name: 'quarter', required: false, example: '3' })
  @ApiResponse({ status: 200, description: 'Quarterly IFTA tax filing calculation returned.' })
  async getIftaQuarterly(@Query('year') yearQ?: string, @Query('quarter') quarterQ?: string) {
    const now = new Date();
    const year = parseInt(yearQ || '') || now.getFullYear();
    const quarter = Math.min(4, Math.max(1, parseInt(quarterQ || '') || Math.floor(now.getMonth() / 3) + 1));
    const from = new Date(year, (quarter - 1) * 3, 1);
    const to = new Date(year, quarter * 3, 1);

    const all = await this.prisma.fuelLog.findMany({
      where: { createdAt: { lt: to } },
      orderBy: [{ assetId: 'asc' }, { odometer: 'asc' }],
    });

    const perState: Record<string, { jurisdiction: string; miles: number; gallons: number; cost: number }> = {};
    const touch = (s: string) => (perState[s] ||= { jurisdiction: s, miles: 0, gallons: 0, cost: 0 });
    const lastByAsset: Record<string, number> = {};
    let milesWithBasis = 0;
    let gallonsWithBasis = 0;

    for (const log of all) {
      const inQuarter = log.createdAt >= from && log.createdAt < to;
      const prevOdo = lastByAsset[log.assetId];
      if (inQuarter) {
        const row = touch(log.location);
        row.gallons += log.gallons;
        row.cost += log.cost;
        if (prevOdo !== undefined && log.odometer > prevOdo) {
          const miles = log.odometer - prevOdo;
          row.miles += miles;
          milesWithBasis += miles;
          gallonsWithBasis += log.gallons;
        }
      }
      lastByAsset[log.assetId] = log.odometer;
    }

    const fleetMpg = gallonsWithBasis > 0 ? milesWithBasis / gallonsWithBasis : 0;
    const rows = Object.values(perState)
      .map(r => {
        const rate = IFTA_DIESEL_RATES[r.jurisdiction];
        const taxableGallons = fleetMpg > 0 ? r.miles / fleetMpg : 0;
        const netGallons = taxableGallons - r.gallons;
        const netTax = rate !== undefined ? netGallons * rate : null;
        return {
          ...r,
          miles: Math.round(r.miles),
          gallons: Number(r.gallons.toFixed(1)),
          cost: Number(r.cost.toFixed(2)),
          rate: rate ?? null,
          taxableGallons: Number(taxableGallons.toFixed(1)),
          netGallons: Number(netGallons.toFixed(1)),
          netTax: netTax === null ? null : Number(netTax.toFixed(2)),
        };
      })
      .sort((a, b) => a.jurisdiction.localeCompare(b.jurisdiction));

    return {
      year,
      quarter,
      fleetMpg: Number(fleetMpg.toFixed(2)),
      totals: {
        miles: rows.reduce((s, r) => s + r.miles, 0),
        gallons: Number(rows.reduce((s, r) => s + r.gallons, 0).toFixed(1)),
        netTax: Number(rows.reduce((s, r) => s + (r.netTax || 0), 0).toFixed(2)),
      },
      rows,
      unratedJurisdictions: rows.filter(r => r.rate === null).map(r => r.jurisdiction),
      method: 'odometer-delta between fills, credited to the later fill jurisdiction',
    };
  }

  // Real TOLL RECORDS Webhook Ingestion Gateway (Bestpass / PrePass)
  @Post('tolls/webhook')
  @ApiOperation({ summary: 'Ingest toll transponder record (Webhook)', description: 'Ingests toll transactions from Bestpass, PrePass, or state toll authorities.' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['assetId', 'transponderId', 'amount', 'location', 'timestamp'],
      properties: {
        assetId: { type: 'string', example: 'asset_123' },
        transponderId: { type: 'string', example: 'TP-99214-EZP' },
        amount: { type: 'number', example: 18.50 },
        location: { type: 'string', example: 'George Washington Bridge WB' },
        timestamp: { type: 'string', format: 'date-time', example: '2026-10-29T14:30:00Z' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Toll record stored.' })
  async ingestTollRecord(
    @Body('assetId') assetId: string,
    @Body('transponderId') transponderId: string,
    @Body('amount') amount: number,
    @Body('location') location: string,
    @Body('timestamp') timestamp: string,
  ) {
    const toll = await this.prisma.tollRecord.create({
      data: {
        assetId,
        transponderId,
        amount,
        location,
        timestamp: new Date(timestamp),
      },
      include: { asset: true },
    });

    return toll;
  }

  @Get('tolls')
  @ApiOperation({ summary: 'List toll records', description: 'Returns all transponder toll transactions across the fleet.' })
  @ApiResponse({ status: 200, description: 'Toll records returned.' })
  async getTolls() {
    return this.prisma.tollRecord.findMany({
      include: { asset: true },
      orderBy: { timestamp: 'desc' },
    });
  }

  // ── RELAY PAYMENTS TMS FUEL API ENDPOINTS ──

  @Get('fuel/relay/status')
  @ApiOperation({ summary: 'Get Relay Payments connection status', description: 'Checks API key authentication and merchant status with Relay Payments staging/production.' })
  @ApiResponse({ status: 200, description: 'Relay connection status.' })
  async getRelayStatus() {
    return this.relayFuelService.getStatus();
  }

  @Get('fuel/relay/policies')
  @ApiOperation({ summary: 'List Relay fuel card policies', description: 'Retrieves spending limits, gallon caps, and product purchase restrictions configured in Relay.' })
  @ApiResponse({ status: 200, description: 'Policies retrieved.' })
  async getRelayPolicies() {
    return this.relayFuelService.getPolicies();
  }

  @Get('fuel/relay/drivers')
  @ApiOperation({ summary: 'Search Relay enrolled drivers', description: 'Queries drivers registered with Relay fuel cards.' })
  @ApiQuery({ name: 'q', required: false, description: 'Search query' })
  @ApiResponse({ status: 200, description: 'Drivers returned.' })
  async getRelayDrivers(@Query('q') q?: string) {
    return this.relayFuelService.getDrivers(q);
  }

  @Get('fuel/relay/codes')
  @ApiOperation({ summary: 'List Relay digital fuel codes', description: 'Retrieves digital fuel dispensing codes issued to drivers.' })
  @ApiQuery({ name: 'dtstart', required: false })
  @ApiQuery({ name: 'dtend', required: false })
  @ApiResponse({ status: 200, description: 'Fuel codes returned.' })
  async getRelayFuelCodes(
    @Query('dtstart') dtstart?: string,
    @Query('dtend') dtend?: string,
  ) {
    return this.relayFuelService.getFuelCodes(dtstart, dtend);
  }

  @Post('fuel/relay/codes')
  @ApiOperation({ summary: 'Generate instant Relay fuel code', description: 'Generates a one-time digital fuel checkout code for a driver at the pump.' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['constraint_amount'],
      properties: {
        constraint_amount: { type: 'string', example: '500.00' },
        driver_id: { type: 'string', example: 'd123' },
        note: { type: 'string', example: 'Full tank fill-up at Love’s #412' },
        location_id: { type: 'string', example: 'loc_789' },
        type: { type: 'string', enum: ['fuel', 'cash'], example: 'fuel' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Fuel code generated.' })
  async createRelayFuelCode(
    @Body() dto: {
      constraint_amount: string;
      driver_id?: string;
      note?: string;
      location_id?: string;
      type?: 'fuel' | 'cash';
    },
  ) {
    return this.relayFuelService.createFuelCode(dto);
  }

  @Get('fuel/relay/transactions')
  @ApiOperation({ summary: 'List Relay fuel card transactions', description: 'Queries real transactions processed through Relay Payment network.' })
  @ApiQuery({ name: 'dtstart', required: false })
  @ApiQuery({ name: 'dtend', required: false })
  @ApiResponse({ status: 200, description: 'Relay transactions list.' })
  async getRelayTransactions(
    @Query('dtstart') dtstart?: string,
    @Query('dtend') dtend?: string,
  ) {
    return this.relayFuelService.getTransactions(dtstart, dtend);
  }

  @Post('fuel/relay/sync')
  @ApiOperation({ summary: 'Sync Relay transactions to local fleet database', description: 'Pulls recent transactions from Relay and creates corresponding FuelLog entries in the fleet database.' })
  @ApiQuery({ name: 'dtstart', required: false })
  @ApiQuery({ name: 'dtend', required: false })
  @ApiResponse({ status: 200, description: 'Transactions synchronized.' })
  async syncRelayTransactions(
    @Query('dtstart') dtstart?: string,
    @Query('dtend') dtend?: string,
  ) {
    return this.relayFuelService.syncTransactionsToFleet(dtstart, dtend);
  }

  @Post('fuel/relay/webhook')
  @ApiOperation({ summary: 'Relay Payments webhook ingestion', description: 'Receives instant push notifications for pump authorizations, declines, and completed fuel transactions.' })
  @ApiHeader({ name: 'x-relay-signature', required: true, description: 'HMAC signature for webhook payload validation' })
  @ApiResponse({ status: 200, description: 'Webhook processed.' })
  async handleRelayWebhook(
    @Headers('x-relay-signature') signature: string,
    @Body() payload: any,
  ) {
    return this.relayFuelService.handleWebhook(payload);
  }
}

