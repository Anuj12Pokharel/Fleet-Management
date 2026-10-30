import { Controller, Get, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiProduces } from '@nestjs/swagger';
import { Response } from 'express';
import { PrismaService } from '../prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Reports')
@ApiBearerAuth('JWT-Auth')
@UseGuards(JwtAuthGuard)
@Controller('api/reports')
export class ReportsController {
  constructor(private prisma: PrismaService) {}

  @Get('ifta/csv')
  @ApiOperation({ summary: 'Export IFTA mileage & fuel report as CSV', description: 'Generates downloaded CSV containing transaction IDs, states, gallons, odometer, and MPG.' })
  @ApiProduces('text/csv')
  @ApiResponse({ status: 200, description: 'CSV file download.' })
  async exportIftaCsv(@Res() res: any) {
    const logs = await this.prisma.fuelLog.findMany({
      include: { asset: true },
    });

    let csvContent = 'Transaction ID,Asset Name,State,Gallons,Cost,Odometer,MPG,Date\n';
    logs.forEach(log => {
      csvContent += `"${log.cardTransactionId}","${log.asset.name}","${log.location}",${log.gallons},${log.cost},${log.odometer},${log.mpg.toFixed(2)},"${log.createdAt.toISOString()}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=ifta_filing_report.csv');
    return res.status(200).send(csvContent);
  }

  @Get('costs/csv')
  @ApiOperation({ summary: 'Export Operating Cost Summary as CSV', description: 'Generates CSV breakdown with maintenance, fuel, toll, and accident totals per vehicle.' })
  @ApiProduces('text/csv')
  @ApiResponse({ status: 200, description: 'CSV file download.' })
  async exportCostsCsv(@Res() res: any) {
    const assets = await this.prisma.asset.findMany({
      include: {
        workOrders: true,
        fuelLogs: true,
        tollRecords: true,
        accidentClaims: true,
      },
    });

    let csvContent = 'Asset Name,VIN,Odometer,Total Maintenance Cost,Total Fuel Cost,Total Toll Cost,Total Accidents Cost,Total Operating Cost\n';
    assets.forEach(asset => {
      const maintCost = asset.workOrders.reduce((sum, wo) => sum + wo.totalCost, 0);
      const fuelCost = asset.fuelLogs.reduce((sum, fl) => sum + fl.cost, 0);
      const tollCost = asset.tollRecords.reduce((sum, tr) => sum + tr.amount, 0);
      const accidentCost = asset.accidentClaims.reduce((sum, ac) => sum + ac.actualRepairCost, 0);
      const totalCost = maintCost + fuelCost + tollCost + accidentCost;

      csvContent += `"${asset.name}","${asset.vin}",${asset.odometer},${maintCost.toFixed(2)},${fuelCost.toFixed(2)},${tollCost.toFixed(2)},${accidentCost.toFixed(2)},${totalCost.toFixed(2)}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=operating_cost_summary.csv');
    return res.status(200).send(csvContent);
  }

  @Get('compliance/csv')
  @ApiOperation({ summary: 'Export PM Compliance report as CSV', description: 'Generates CSV showing PM schedule compliance across all fleet units.' })
  @ApiProduces('text/csv')
  @ApiResponse({ status: 200, description: 'CSV file download.' })
  async exportComplianceCsv(@Res() res: any) {
    const schedules = await this.prisma.pMSchedule.findMany({
      include: { asset: true, template: true },
    });

    let csvContent = 'Asset Name,PM Template,Last Service Mileage,Next Due Mileage,Next Due Date,Status\n';
    schedules.forEach(sched => {
      csvContent += `"${sched.asset.name}","${sched.template.name}",${sched.lastServiceOdometer},${sched.nextDueOdometer},"${sched.nextDueDate.toISOString().split('T')[0]}","${sched.status}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=pm_compliance_report.csv');
    return res.status(200).send(csvContent);
  }

  @Get('tco')
  @ApiOperation({ summary: 'Get Total Cost of Ownership (TCO) breakdown', description: 'Calculates real cost-per-mile across maintenance, fuel, tolls, and collision claims.' })
  @ApiResponse({ status: 200, description: 'TCO metrics array.' })
  async getTcoReport() {
    const assets = await this.prisma.asset.findMany({
      include: {
        workOrders: true,
        fuelLogs: true,
        tollRecords: true,
        accidentClaims: true,
      },
    });

    return assets.map(asset => {
      const maintenanceCost = asset.workOrders.reduce((sum, wo) => sum + wo.totalCost, 0);
      const fuelCost = asset.fuelLogs.reduce((sum, fl) => sum + fl.cost, 0);
      const tollCost = asset.tollRecords.reduce((sum, tr) => sum + tr.amount, 0);
      const accidentCost = asset.accidentClaims.reduce((sum, ac) => sum + ac.actualRepairCost, 0);
      const totalCost = maintenanceCost + fuelCost + tollCost + accidentCost;
      const costPerMile = asset.odometer > 0 ? Number((totalCost / asset.odometer).toFixed(3)) : 0;

      return {
        assetId: asset.id,
        assetName: asset.name,
        vin: asset.vin,
        odometer: asset.odometer,
        maintenanceCost,
        fuelCost,
        tollCost,
        accidentCost,
        totalCost,
        costPerMile,
      };
    });
  }

  @Get('pm-compliance')
  @ApiOperation({ summary: 'Get PM compliance metrics', description: 'Returns overall percentage of fleet compliant with scheduled maintenance intervals.' })
  @ApiResponse({ status: 200, description: 'Compliance statistics.' })
  async getPmComplianceReport() {
    const schedules = await this.prisma.pMSchedule.findMany({
      include: { asset: true, template: true },
    });

    const total = schedules.length;
    const compliant = schedules.filter(s => s.status === 'COMPLIANT').length;
    const due = schedules.filter(s => s.status === 'DUE').length;
    const overdue = schedules.filter(s => s.status === 'OVERDUE').length;
    const complianceRate = total > 0 ? Math.round((compliant / total) * 100) : 100;

    return {
      total,
      compliant,
      due,
      overdue,
      complianceRate,
      schedules,
    };
  }

  @Get('dot-violation-trends')
  @ApiOperation({ summary: 'Get DOT inspection violation trends', description: 'Returns historical timeline of roadside inspections and recurring violation codes.' })
  @ApiResponse({ status: 200, description: 'Trends array.' })
  async getDotViolationTrends() {
    const inspections = await this.prisma.dOTInspection.findMany({
      include: { asset: true },
      orderBy: { inspectionDate: 'asc' },
    });

    return inspections.map(i => ({
      id: i.id,
      assetName: i.asset.name,
      inspectionDate: i.inspectionDate,
      result: i.result,
      violations: JSON.parse(i.violationsJson || '[]'),
    }));
  }
}
