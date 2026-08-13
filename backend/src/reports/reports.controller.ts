import { Controller, Get, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { PrismaService } from '../prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('api/reports')
export class ReportsController {
  constructor(private prisma: PrismaService) {}

  @Get('ifta/csv')
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
}
