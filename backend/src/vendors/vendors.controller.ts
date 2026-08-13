import { Controller, Get, Post, Put, Body, Param, UseGuards, Req } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role, VendorType, EmergencyStatus } from '../enums';
import { NotificationsService } from '../notifications/notifications.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api')
export class VendorsController {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  // VENDORS CRM
  @Get('vendors')
  async getVendors() {
    const list = await this.prisma.vendor.findMany();
    return list.map(v => ({
      ...v,
      invoiceHistory: JSON.parse(v.invoiceHistory || '[]'),
    }));
  }

  @Roles(Role.MAINTENANCE_ADMIN, Role.FLEET_MANAGER)
  @Post('vendors')
  async createVendor(
    @Body('name') name: string,
    @Body('type') type: VendorType,
    @Body('negotiatedRate') negotiatedRate: number,
    @Body('contactInfo') contactInfo: string,
  ) {
    const vendor = await this.prisma.vendor.create({
      data: {
        name,
        type,
        negotiatedRate,
        contactInfo,
        invoiceHistory: '[]',
      },
    });
    return {
      ...vendor,
      invoiceHistory: [],
    };
  }

  // Invoice Auto-Ingestion Simulation (TA/Petro invoice intake)
  @Roles(Role.MAINTENANCE_ADMIN, Role.FLEET_MANAGER)
  @Post('vendors/:id/ingest-invoice')
  async ingestInvoice(
    @Param('id') vendorId: string,
    @Body('invoiceNo') invoiceNo: string,
    @Body('amount') amount: number,
    @Body('details') details: string,
  ) {
    const vendor = await this.prisma.vendor.findUnique({ where: { id: vendorId } });
    if (!vendor) throw new Error('Vendor not found');

    const history = JSON.parse(vendor.invoiceHistory || '[]');
    const newInvoice = { invoiceNo, amount, date: new Date().toISOString().split('T')[0], details };
    history.push(newInvoice);

    const updated = await this.prisma.vendor.update({
      where: { id: vendorId },
      data: { invoiceHistory: JSON.stringify(history) },
    });

    return {
      ...updated,
      invoiceHistory: history,
    };
  }

  // EMERGENCY ROADSIDE TICKETS
  @Get('emergency')
  async getEmergencyTickets() {
    return this.prisma.emergencyTicket.findMany({
      include: {
        asset: true,
        reporter: { select: { id: true, name: true } },
        assignedVendor: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Post('emergency')
  async createEmergencyTicket(
    @Req() req: any,
    @Body('assetId') assetId: string,
    @Body('description') description: string,
    @Body('gpsLatitude') gpsLatitude: number,
    @Body('gpsLongitude') gpsLongitude: number,
  ) {
    // 1. Find the nearest approved vendor using GPS proximity math
    const vendors = await this.prisma.vendor.findMany();
    
    // We mock vendor coordinates for proximity lookup
    const vendorCoords: Record<string, { lat: number; lng: number }> = {
      'Dallas': { lat: 32.7767, lng: -96.7970 },
      'Fort Worth': { lat: 32.7555, lng: -97.3308 },
      'Austin': { lat: 30.2672, lng: -97.7431 },
      'Houston': { lat: 29.7604, lng: -95.3698 },
    };

    let closestVendor: any = null;
    let minDistance = Infinity;

    vendors.forEach(vendor => {
      // Find matching mock coordinate or allocate a default
      const city = Object.keys(vendorCoords).find(k => vendor.name.includes(k)) || 'Dallas';
      const coords = vendorCoords[city];
      
      const distance = Math.sqrt(
        Math.pow(gpsLatitude - coords.lat, 2) + Math.pow(gpsLongitude - coords.lng, 2)
      );

      if (distance < minDistance) {
        minDistance = distance;
        closestVendor = vendor;
      }
    });

    // 2. Create Emergency ticket
    const ticket = await this.prisma.emergencyTicket.create({
      data: {
        assetId,
        reporterId: req.user.id,
        description,
        gpsLatitude,
        gpsLongitude,
        status: EmergencyStatus.OPEN,
        assignedVendorId: closestVendor ? closestVendor.id : null,
        mechanicEta: closestVendor ? new Date(Date.now() + 45 * 60 * 1000) : null, // 45 mins from now
      },
      include: {
        asset: true,
        assignedVendor: true,
      },
    });

    // 3. Mark asset as INOPERABLE
    await this.prisma.asset.update({
      where: { id: assetId },
      data: { status: 'INOPERABLE' },
    });

    this.notificationsService.emit({
      type: 'BREAKDOWN',
      title: `Critical Breakdown: ${ticket.asset.name}`,
      message: `Emergency reported. Nearest vendor "${ticket.assignedVendor?.name || 'None'}" dispatched. ETA: 45 min.`,
      assetId: assetId,
      timestamp: new Date().toISOString(),
    });

    return ticket;
  }

  @Put('emergency/:id')
  async updateEmergencyTicket(
    @Param('id') id: string,
    @Body('status') status: EmergencyStatus,
    @Body('downtimeHours') downtimeHours?: number,
  ) {
    const ticket = await this.prisma.emergencyTicket.update({
      where: { id },
      data: {
        status,
        downtimeHours: downtimeHours ?? 0,
      },
      include: { asset: true },
    });

    // If completed, check and restore status
    if (status === EmergencyStatus.COMPLETED) {
      await this.prisma.asset.update({
        where: { id: ticket.assetId },
        data: { status: 'OPERABLE' },
      });
    }

    return ticket;
  }
}
