import { Controller, Get, Post, Put, Body, Param, UseGuards, Req } from '@nestjs/common';
import { AssetsService } from './assets.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role, AssetStatus, AssetType } from '../enums';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/assets')
export class AssetsController {
  constructor(private assetsService: AssetsService) {}

  @Get()
  async findAll() {
    return this.assetsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.assetsService.findOne(id);
  }

  @Roles(Role.MAINTENANCE_ADMIN, Role.FLEET_MANAGER)
  @Post()
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
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() data: any,
  ) {
    return this.assetsService.update(id, data, req.user.id);
  }

  @Roles(Role.MAINTENANCE_ADMIN, Role.FLEET_MANAGER)
  @Post(':id/override')
  async overrideStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body('status') status: AssetStatus,
  ) {
    return this.assetsService.overrideStatus(id, status, req.user.id);
  }

  @Get(':id/dispatch-check')
  async checkDispatchBlock(@Param('id') id: string) {
    return this.assetsService.checkDispatchBlock(id);
  }

  @Post('scan')
  async scanQR(@Body('code') code: string) {
    return this.assetsService.scanQR(code);
  }
}
