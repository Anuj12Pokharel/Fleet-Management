import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { PrismaService } from '../prisma.service';
import { RenewalsService, SaveRenewalDto } from './renewals.service';
import { ZitadelRenewalAuthGuard } from './zitadel-renewal-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role, RenewalType, RenewalStatus } from '../enums';

@ApiTags('Renewals')
@ApiBearerAuth('JWT-Auth')
@UseGuards(ZitadelRenewalAuthGuard, RolesGuard)
@Controller('api/renewals')
export class RenewalsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly renewalsService: RenewalsService,
  ) {}

  /**
   * Universal Get Renewals: Returns active ComplianceRenewals (and legacy alerts)
   */
  @Get()
  @ApiOperation({
    summary: 'Get all compliance renewals',
    description: 'Retrieves 33-item FMCSA/DOT compliance items across DRIVER, EQUIPMENT, and CARRIER scopes with urgency metrics and verification status.',
  })
  @ApiQuery({ name: 'scope', required: false, enum: ['DRIVER', 'EQUIPMENT', 'CARRIER'] })
  @ApiQuery({ name: 'driverId', required: false })
  @ApiQuery({ name: 'assetId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'verificationStatus', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiResponse({ status: 200, description: 'Renewals list returned.' })
  async getRenewals(
    @Query('scope') scope?: string,
    @Query('driverId') driverId?: string,
    @Query('assetId') assetId?: string,
    @Query('status') status?: string,
    @Query('verificationStatus') verificationStatus?: string,
    @Query('search') search?: string,
  ) {
    const complianceRenewals = await this.renewalsService.findAll({
      scope,
      driverId,
      assetId,
      status,
      verificationStatus,
      search,
    });

    // Also include legacy RenewalAlerts for backwards compatibility if no scope filter or scope === EQUIPMENT
    if (!scope || scope === 'EQUIPMENT') {
      const legacyAlerts = await this.prisma.renewalAlert.findMany({
        include: { asset: true },
        orderBy: { expiryDate: 'asc' },
      });

      const formattedLegacy = legacyAlerts.map(alert => {
        const { daysLeft, urgency } = this.renewalsService.calcUrgency(alert.expiryDate);
        return {
          id: alert.id,
          scope: 'EQUIPMENT',
          type: alert.type,
          title: (alert.type as string).replace(/_/g, ' '),
          description: alert.description,
          assetId: alert.assetId,
          assetName: alert.asset?.name || null,
          expiryDate: alert.expiryDate.toISOString(),
          status: alert.status,
          daysLeft,
          urgency,
          enteredByName: 'System',
          enteredByRole: 'SYSTEM',
          verificationStatus: 'VERIFIED',
          alertLeadDays: 30,
        };
      });

      // Deduplicate if needed
      return [...complianceRenewals, ...formattedLegacy];
    }

    return complianceRenewals;
  }

  /**
   * Summary counts across all 33 items for KPI indicators
   */
  @Get('summary')
  @ApiOperation({ summary: 'Compliance KPI summary', description: 'Returns high-level summary counts: total items, urgent alerts, verified vs pending verification.' })
  @ApiResponse({ status: 200, description: 'Summary statistics returned.' })
  async getSummary() {
    return this.renewalsService.getSummary();
  }

  /**
   * Fleet Manager Master Save: Add or Edit ANY record across Driver, Equipment, or Carrier
   */
  @Roles(Role.MAINTENANCE_ADMIN, Role.FLEET_MANAGER)
  @Post('admin/save')
  @ApiOperation({ summary: 'Fleet Manager Master Save', description: 'Master control endpoint to add, update, or auto-verify any of the 33 compliance items across all scopes.' })
  @ApiResponse({ status: 200, description: 'Renewal record saved and verified.' })
  async masterSave(@Request() req: any, @Body() body: SaveRenewalDto) {
    return this.renewalsService.masterSave(req.user, body);
  }

  /**
   * Fleet Manager Master Delete
   */
  @Roles(Role.MAINTENANCE_ADMIN, Role.FLEET_MANAGER)
  @Delete('admin/:id')
  @ApiOperation({ summary: 'Delete renewal item', description: 'Deletes a compliance renewal record by ID.' })
  @ApiParam({ name: 'id', description: 'Renewal ID' })
  @ApiResponse({ status: 200, description: 'Renewal deleted.' })
  async deleteRenewal(@Request() req: any, @Param('id') id: string) {
    return this.renewalsService.deleteRenewal(req.user, id);
  }

  /**
   * Driver Self-Service Submission (Submits CDL, Med Cert, TWIC, etc.)
   */
  @Roles(Role.DRIVER, Role.MAINTENANCE_ADMIN, Role.FLEET_MANAGER)
  @Post('driver/submit')
  @ApiOperation({ summary: 'Driver Self-Service submission', description: 'Allows drivers to submit documents (CDL, Med Card, TWIC, HOS) into PENDING_VERIFICATION queue.' })
  @ApiResponse({ status: 200, description: 'Driver renewal submitted for manager verification.' })
  async driverSubmit(@Request() req: any, @Body() body: SaveRenewalDto) {
    return this.renewalsService.driverSubmit(req.user, body);
  }

  /**
   * Mechanic Shop Submission (Annual DOT, IFTA Decal, Form 2290, PM interval)
   */
  @Roles(Role.MECHANIC, Role.MAINTENANCE_ADMIN, Role.FLEET_MANAGER)
  @Post('equipment/submit')
  @ApiOperation({ summary: 'Mechanic Equipment submission', description: 'Allows mechanics to record Annual DOT inspections, IFTA decals, and PM completions.' })
  @ApiResponse({ status: 200, description: 'Equipment renewal submitted.' })
  async equipmentSubmit(@Request() req: any, @Body() body: SaveRenewalDto) {
    return this.renewalsService.equipmentSubmit(req.user, body);
  }

  /**
   * Manager Verification Engine (Approve or Reject Driver/Mechanic Submissions)
   */
  @Roles(Role.MAINTENANCE_ADMIN, Role.FLEET_MANAGER)
  @Post(':id/verify')
  @ApiOperation({ summary: 'Manager Verification Action', description: 'Approves or rejects a submitted compliance item. Setting approved: false requires rejection notes.' })
  @ApiParam({ name: 'id', description: 'Renewal ID' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['approved'],
      properties: {
        approved: { type: 'boolean', example: true },
        notes: { type: 'string', example: 'CDL front and back verified against Texas DPS.' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Verification verdict applied.' })
  async verifyRenewal(
    @Request() req: any,
    @Param('id') id: string,
    @Body('approved') approved: boolean,
    @Body('notes') notes?: string,
  ) {
    return this.renewalsService.verifyRenewal(req.user, id, approved, notes);
  }

  /**
   * Legacy Create Endpoint for Backwards-Compatibility
   */
  @Roles(Role.MAINTENANCE_ADMIN, Role.FLEET_MANAGER)
  @Post()
  @ApiOperation({ summary: 'Create legacy renewal alert', description: 'Backwards-compatible endpoint for creating legacy renewal alerts.' })
  @ApiResponse({ status: 201, description: 'Renewal alert created.' })
  async createLegacyRenewal(
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

  /**
   * Legacy Dismiss Endpoint
   */
  @Roles(Role.MAINTENANCE_ADMIN, Role.FLEET_MANAGER)
  @Post(':id/dismiss')
  @ApiOperation({ summary: 'Dismiss renewal alert', description: 'Sets status of renewal alert to DISMISSED.' })
  @ApiParam({ name: 'id', description: 'Renewal ID' })
  @ApiResponse({ status: 200, description: 'Renewal dismissed.' })
  async dismissRenewal(@Param('id') id: string) {
    // Try updating compliance renewal first, fallback to renewalAlert
    try {
      return await (this.prisma as any).complianceRenewal.update({
        where: { id },
        data: { status: 'DISMISSED' },
      });
    } catch {
      return this.prisma.renewalAlert.update({
        where: { id },
        data: { status: RenewalStatus.DISMISSED },
      });
    }
  }
}
