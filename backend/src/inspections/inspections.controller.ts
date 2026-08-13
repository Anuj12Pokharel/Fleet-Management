import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { InspectionsService } from './inspections.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role, InspectionStatus } from '../enums';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/inspections')
export class InspectionsController {
  constructor(private inspectionsService: InspectionsService) {}

  @Get()
  async findAll() {
    return this.inspectionsService.findAll();
  }

  @Roles(Role.DRIVER, Role.MAINTENANCE_ADMIN, Role.FLEET_MANAGER)
  @Post()
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
}
