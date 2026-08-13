import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../enums';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api')
export class AccidentsController {
  constructor(private prisma: PrismaService) {}

  @Get('accidents')
  async getAccidents() {
    return this.prisma.accidentClaim.findMany({
      include: {
        asset: true,
        driver: { select: { id: true, name: true } },
      },
      orderBy: { claimDate: 'desc' },
    });
  }

  @Roles(Role.DRIVER, Role.MAINTENANCE_ADMIN, Role.FLEET_MANAGER)
  @Post('accidents')
  async createClaim(
    @Req() req: any,
    @Body('assetId') assetId: string,
    @Body('policeReportNumber') policeReportNumber: string,
    @Body('statement') statement: string,
    @Body('thirdPartyDetails') thirdPartyDetails: string,
    @Body('claimDate') claimDate: string,
  ) {
    return this.prisma.accidentClaim.create({
      data: {
        assetId,
        driverId: req.user.id,
        policeReportNumber,
        statement,
        thirdPartyDetails,
        claimDate: new Date(claimDate),
        status: 'OPEN',
      },
    });
  }

  // Insurance cost analysis
  @Roles(Role.MAINTENANCE_ADMIN, Role.FLEET_MANAGER)
  @Get('accidents/analytics')
  async getClaimAnalytics() {
    const claims = await this.prisma.accidentClaim.findMany({
      include: { asset: true },
    });

    // Calculate TCO metrics: payout vs actual repair costs per asset
    const analyticsMap: Record<string, {
      assetName: string;
      claimsCount: number;
      totalPayouts: number;
      totalRepairCosts: number;
      netFinancialImpact: number;
    }> = {};

    claims.forEach(claim => {
      const assetId = claim.assetId;
      if (!analyticsMap[assetId]) {
        analyticsMap[assetId] = {
          assetName: claim.asset.name,
          claimsCount: 0,
          totalPayouts: 0,
          totalRepairCosts: 0,
          netFinancialImpact: 0,
        };
      }

      analyticsMap[assetId].claimsCount += 1;
      analyticsMap[assetId].totalPayouts += claim.insurancePayout;
      analyticsMap[assetId].totalRepairCosts += claim.actualRepairCost;
      analyticsMap[assetId].netFinancialImpact = analyticsMap[assetId].totalRepairCosts - analyticsMap[assetId].totalPayouts;
    });

    return Object.values(analyticsMap);
  }
}
