import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NotificationsService } from '../notifications/notifications.service';

@UseGuards(JwtAuthGuard)
@Controller('api')
export class FuelController {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  // FUEL CARD Webhook Ingestion Simulation
  @Post('fuel/webhook')
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
  async getFuelLogs() {
    return this.prisma.fuelLog.findMany({
      include: { asset: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // IFTA Logs report grouped by jurisdiction (state)
  @Get('fuel/ifta')
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

  // TOLL RECORDS Webhook Ingestion Simulation
  @Post('tolls/webhook')
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
  async getTolls() {
    return this.prisma.tollRecord.findMany({
      include: { asset: true },
      orderBy: { timestamp: 'desc' },
    });
  }
}
