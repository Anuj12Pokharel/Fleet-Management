import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';
import { InspectionsService } from './inspections.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role, InspectionStatus } from '../enums';

@ApiTags('Inspections')
@ApiBearerAuth('JWT-Auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/inspections')
export class InspectionsController {
  constructor(private inspectionsService: InspectionsService) {}

  @Get()
  @ApiOperation({ summary: 'List all eDVIR inspections', description: 'Returns electronic driver vehicle inspection reports with checklist details and signoff records.' })
  @ApiResponse({ status: 200, description: 'Inspections retrieved.' })
  async findAll() {
    return this.inspectionsService.findAll();
  }

  @Roles(Role.DRIVER, Role.MAINTENANCE_ADMIN, Role.FLEET_MANAGER)
  @Post()
  @ApiOperation({ summary: 'Submit pre-trip or post-trip eDVIR', description: 'Submits inspection checklist. Failed safety items automatically trigger defect alerts.' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['assetId', 'status', 'odometer', 'checklistJson'],
      properties: {
        assetId: { type: 'string', example: 'asset_123' },
        status: { type: 'string', enum: ['PASSED', 'FAILED'], example: 'PASSED' },
        odometer: { type: 'number', example: 142500 },
        checklistJson: { type: 'object', example: { brakes: 'PASS', lights: 'PASS', tires: 'PASS' } },
        notes: { type: 'string', example: 'Pre-trip completed cleanly.' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Inspection recorded.' })
  async create(
    @Req() req: any,
    @Body('assetId') assetId: string,
    @Body('status') status: InspectionStatus,
    @Body('odometer') odometer: number,
    @Body('checklistJson') checklistJson: any,
    @Body('notes') notes?: string,
  ) {
    return this.inspectionsService.create({
      assetId,
      driverId: req.user.id,
      status,
      odometer,
      checklistJson,
      notes,
    });
  }

  @Roles(Role.MECHANIC, Role.MAINTENANCE_ADMIN, Role.FLEET_MANAGER)
  @Post(':id/mechanic-signoff')
  @ApiOperation({ summary: 'Mechanic certification sign-off', description: 'Mechanic certifies that defects reported in eDVIR have been repaired or do not compromise safe operation.' })
  @ApiParam({ name: 'id', description: 'Inspection ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        notes: { type: 'string', example: 'Adjusted air brake chamber tension and verified PSI.' },
        clearInoperable: { type: 'boolean', example: true },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Mechanic sign-off completed.' })
  async mechanicSignOff(
    @Req() req: any,
    @Param('id') id: string,
    @Body('notes') notes?: string,
    @Body('clearInoperable') clearInoperable?: boolean,
  ) {
    return this.inspectionsService.mechanicSignOff(
      id,
      {
        mechanicName: req.user.name,
        notes,
        clearInoperable: clearInoperable ?? true,
      },
      req.user.id,
    );
  }

  @Roles(Role.DRIVER, Role.MAINTENANCE_ADMIN, Role.FLEET_MANAGER)
  @Post(':id/driver-review')
  @ApiOperation({ summary: 'Subsequent driver review sign-off', description: 'Next driver signs review confirming that certified repairs were inspected before dispatch.' })
  @ApiParam({ name: 'id', description: 'Inspection ID' })
  @ApiResponse({ status: 200, description: 'Driver review recorded.' })
  async driverReview(
    @Req() req: any,
    @Param('id') id: string,
  ) {
    return this.inspectionsService.nextDriverReview(
      id,
      { driverName: req.user.name },
      req.user.id,
    );
  }
}
