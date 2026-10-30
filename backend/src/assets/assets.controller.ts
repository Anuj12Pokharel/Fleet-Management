import { Controller, Get, Post, Put, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';
import { AssetsService } from './assets.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role, AssetStatus, AssetType } from '../enums';

@ApiTags('Assets')
@ApiBearerAuth('JWT-Auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/assets')
export class AssetsController {
  constructor(private assetsService: AssetsService) {}

  @Get()
  @ApiOperation({ summary: 'List all fleet assets', description: 'Returns all tractors, trailers, and associated components.' })
  @ApiResponse({ status: 200, description: 'List of assets returned successfully.' })
  async findAll() {
    return this.assetsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get asset by ID', description: 'Retrieves complete vehicle or trailer details by ID.' })
  @ApiParam({ name: 'id', description: 'Asset ID' })
  @ApiResponse({ status: 200, description: 'Asset found.' })
  @ApiResponse({ status: 404, description: 'Asset not found.' })
  async findOne(@Param('id') id: string) {
    return this.assetsService.findOne(id);
  }

  @Roles(Role.MAINTENANCE_ADMIN, Role.FLEET_MANAGER)
  @Post()
  @ApiOperation({ summary: 'Create new asset', description: 'Registers a new tractor or trailer in the fleet. Requires MAINTENANCE_ADMIN or FLEET_MANAGER.' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['type', 'name', 'vin', 'plateNumber'],
      properties: {
        type: { type: 'string', enum: ['TRACTOR', 'TRAILER'], example: 'TRACTOR' },
        name: { type: 'string', example: 'Truck #104 (Freightliner Cascadia)' },
        vin: { type: 'string', example: '1FUJGLDR5ELBP8921' },
        plateNumber: { type: 'string', example: 'TX-98421K' },
        odometer: { type: 'number', example: 125000 },
        fuelType: { type: 'string', example: 'DIESEL' },
        parentAssetId: { type: 'string', description: 'Optional assigned tractor ID if trailer' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Asset created successfully.' })
  async create(
    @Req() req: any,
    @Body('type') type: AssetType,
    @Body('name') name: string,
    @Body('vin') vin: string,
    @Body('plateNumber') plateNumber: string,
    @Body('odometer') odometer?: number,
    @Body('fuelType') fuelType?: string,
    @Body('parentAssetId') parentAssetId?: string,
  ) {
    return this.assetsService.create({ type, name, vin, plateNumber, odometer, fuelType, parentAssetId }, req.user.id);
  }

  @Roles(Role.MAINTENANCE_ADMIN, Role.FLEET_MANAGER)
  @Put(':id')
  @ApiOperation({ summary: 'Update asset details', description: 'Updates vehicle metadata, specs, or assignment details.' })
  @ApiParam({ name: 'id', description: 'Asset ID' })
  @ApiResponse({ status: 200, description: 'Asset updated successfully.' })
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() data: any,
  ) {
    return this.assetsService.update(id, data, req.user.id);
  }

  @Roles(Role.MAINTENANCE_ADMIN, Role.FLEET_MANAGER)
  @Post(':id/override')
  @ApiOperation({ summary: 'Override asset status', description: 'Forces asset status to OPERABLE, NEEDS_ATTENTION, or INOPERABLE.' })
  @ApiParam({ name: 'id', description: 'Asset ID' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['status'],
      properties: {
        status: { type: 'string', enum: ['OPERABLE', 'NEEDS_ATTENTION', 'INOPERABLE'], example: 'OPERABLE' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Status overridden successfully.' })
  async overrideStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body('status') status: AssetStatus,
  ) {
    return this.assetsService.overrideStatus(id, status, req.user.id);
  }

  @Get(':id/dispatch-check')
  @ApiOperation({ summary: 'Dispatch safety check', description: 'Checks whether the asset has critical defects, expired renewals, or unapproved repairs blocking dispatch.' })
  @ApiParam({ name: 'id', description: 'Asset ID' })
  @ApiResponse({ status: 200, description: 'Dispatch block verdict returned.' })
  async checkDispatchBlock(@Param('id') id: string) {
    return this.assetsService.checkDispatchBlock(id);
  }

  @Post('scan')
  @ApiOperation({ summary: 'Scan asset QR code', description: 'Decodes QR tag or VIN barcode and fetches associated vehicle profile.' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['code'],
      properties: {
        code: { type: 'string', example: 'ASSET-TRK-104' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Asset details matched by QR tag.' })
  async scanQR(@Body('code') code: string) {
    return this.assetsService.scanQR(code);
  }
}
