import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role, RenewalType, RenewalStatus } from '../enums';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/renewals')
export class RenewalsController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async getRenewals() {
    const alerts = await this.prisma.renewalAlert.findMany({
      include: { asset: true },
      orderBy: { expiryDate: 'asc' },
    });

    // Enforce multi-tier calculations for UI alerts representation
    return alerts.map(alert => {
      const daysLeft = Math.ceil((new Date(alert.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      let urgency: 'NONE' | 'INFO' | 'WARNING' | 'CRITICAL' = 'NONE';
      if (daysLeft <= 0) {
        urgency = 'CRITICAL';
      } else if (daysLeft <= 5) {
        urgency = 'CRITICAL';
      } else if (daysLeft <= 15) {
        urgency = 'WARNING';
      } else if (daysLeft <= 30) {
        urgency = 'INFO';
      }

      return {
        ...alert,
        daysLeft,
        urgency,
      };
    });
  }

  @Roles(Role.MAINTENANCE_ADMIN, Role.FLEET_MANAGER)
  @Post()
  async createRenewal(
    @Body('assetId') assetId: string,
    @Body('type') type: RenewalType,
    @Body('description') description: string,
    @Body('expiryDate') expiryDate: string,
  ) {
    const expiry = new Date(expiryDate);
    
    const alert = await this.prisma.renewalAlert.create({
      data: {
        assetId,
        type,
        description,
        expiryDate: expiry,
        status: RenewalStatus.ACTIVE,
      },
      include: { asset: true },
    });

    return alert;
  }

  @Roles(Role.MAINTENANCE_ADMIN, Role.FLEET_MANAGER)
  @Post(':id/dismiss')
  async dismissRenewal(@Param('id') id: string) {
    return this.prisma.renewalAlert.update({
      where: { id },
      data: { status: RenewalStatus.DISMISSED },
    });
  }
}
