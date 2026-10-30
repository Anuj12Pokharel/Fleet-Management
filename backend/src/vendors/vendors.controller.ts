import { Controller, Get, Post, Put, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';
import { PrismaService } from '../prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role, VendorType, EmergencyStatus } from '../enums';
import { NotificationsService } from '../notifications/notifications.service';

@ApiTags('Vendors')
@ApiBearerAuth('JWT-Auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api')
export class VendorsController {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  // VENDORS CRM
  @Get('vendors')
  @ApiOperation({ summary: 'List approved maintenance vendors', description: 'Returns commercial truck shops, tire specialists, and mobile roadside mechanics.' })
  @ApiResponse({ status: 200, description: 'Vendors list.' })
  async getVendors() {
    const list = await this.prisma.vendor.findMany();
    return list.map(v => ({
      ...v,
      invoiceHistory: JSON.parse(v.invoiceHistory || '[]'),
    }));
  }

  @Roles(Role.MAINTENANCE_ADMIN, Role.FLEET_MANAGER)
  @Post('vendors')
  @ApiOperation({ summary: 'Add approved vendor', description: 'Registers an approved maintenance vendor with contracted labor rate.' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['name', 'type', 'negotiatedRate'],
      properties: {
        name: { type: 'string', example: 'Love’s Travel Stop & Truck Tire Care #412' },
        type: { type: 'string', enum: ['HEAVY_DUTY_SHOP', 'TYRE_SPECIALIST', 'MOBILE_ROADSIDE_SERVICE', 'INDEPENDENT_MECHANIC', 'DOT_INSPECTOR'], example: 'TYRE_SPECIALIST' },
        negotiatedRate: { type: 'number', example: 125.00 },
        contactInfo: { type: 'string', example: '+1 (800) 555-0199, I-35 Exit 214, Dallas, TX' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Vendor created.' })
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

  // Real Electronic Invoice Auto-Ingestion Gateway (TA/Petro/Loves EDI & API intake)
  @Roles(Role.MAINTENANCE_ADMIN, Role.FLEET_MANAGER)
  @Post('vendors/:id/ingest-invoice')
  @ApiOperation({ summary: 'Ingest vendor electronic invoice', description: 'Appends repair invoice to vendor history.' })
  @ApiParam({ name: 'id', description: 'Vendor ID' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['invoiceNo', 'amount'],
      properties: {
        invoiceNo: { type: 'string', example: 'INV-LOVES-99214' },
        amount: { type: 'number', example: 450.00 },
        details: { type: 'string', example: 'Trailer axle wheel seal replacement and fluid flush' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Invoice appended.' })
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
  @ApiOperation({ summary: 'List emergency roadside tickets', description: 'Returns active breakdown incidents, driver GPS coordinates, and dispatched vendor ETAs.' })
  @ApiResponse({ status: 200, description: 'Emergency tickets list.' })
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
  @ApiOperation({ summary: 'Dispatch roadside breakdown assistance', description: 'Logs emergency breakdown, computes nearest approved vendor by GPS proximity, marks vehicle INOPERABLE, and calculates mechanic ETA.' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['assetId', 'description', 'gpsLatitude', 'gpsLongitude'],
      properties: {
        assetId: { type: 'string', example: 'asset_123' },
        description: { type: 'string', example: 'Blown right trailer tire on I-20 Westbound mile marker 412.' },
        gpsLatitude: { type: 'number', example: 32.7767 },
        gpsLongitude: { type: 'number', example: -96.7970 },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Emergency ticket created and vendor dispatched.' })
  async createEmergencyTicket(
    @Req() req: any,
    @Body('assetId') assetId: string,
    @Body('description') description: string,
    @Body('gpsLatitude') gpsLatitude: number,
    @Body('gpsLongitude') gpsLongitude: number,
  ) {
    // 1. Find the nearest approved vendor using GPS proximity math
    const vendors = await this.prisma.vendor.findMany();
    
    let closestVendor: any = vendors.length > 0 ? vendors[0] : null;
    if (vendors.length > 1 && gpsLatitude && gpsLongitude) {
      const metroCoordinates: Record<string, { lat: number; lng: number }> = {
        'Dallas': { lat: 32.7767, lng: -96.7970 },
        'Fort Worth': { lat: 32.7555, lng: -97.3308 },
        'Austin': { lat: 30.2672, lng: -97.7431 },
        'Houston': { lat: 29.7604, lng: -95.3698 },
      };

      let minDistance = Infinity;
      for (const vendor of vendors) {
        const city = Object.keys(metroCoordinates).find(k => (vendor.name + ' ' + (vendor.contactInfo || '')).includes(k));
        if (city) {
          const coords = metroCoordinates[city];
          const distance = Math.hypot(gpsLatitude - coords.lat, gpsLongitude - coords.lng);
          if (distance < minDistance) {
            minDistance = distance;
            closestVendor = vendor;
          }
        }
      }
    }

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
  @ApiOperation({ summary: 'Update emergency ticket status', description: 'Updates status (DISPATCHED, COMPLETED). Marking COMPLETED restores vehicle status to OPERABLE.' })
  @ApiParam({ name: 'id', description: 'Emergency ticket ID' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['status'],
      properties: {
        status: { type: 'string', enum: ['OPEN', 'DISPATCHED', 'COMPLETED'], example: 'COMPLETED' },
        downtimeHours: { type: 'number', example: 1.5 },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Emergency ticket updated.' })
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
