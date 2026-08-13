import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { PmService } from './pm.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../enums';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/pm')
export class PmController {
  constructor(private pmService: PmService) {}

  @Get('templates')
  async getTemplates() {
    return this.pmService.findAllTemplates();
  }

  @Roles(Role.MAINTENANCE_ADMIN, Role.FLEET_MANAGER)
  @Post('templates')
  async createTemplate(
    @Body('name') name: string,
    @Body('description') description: string,
    @Body('triggerMileage') triggerMileage: number,
    @Body('triggerDays') triggerDays: number,
    @Body('stepsJson') stepsJson: string[],
  ) {
    return this.pmService.createTemplate({ name, description, triggerMileage, triggerDays, stepsJson });
  }

  @Get('schedules')
  async getSchedules() {
    return this.pmService.findAllSchedules();
  }

  @Roles(Role.MAINTENANCE_ADMIN, Role.FLEET_MANAGER)
  @Post('schedules')
  async createSchedule(
    @Body('assetId') assetId: string,
    @Body('templateId') templateId: string,
    @Body('lastServiceOdometer') lastServiceOdometer: number,
    @Body('lastServiceDate') lastServiceDate: string,
  ) {
    return this.pmService.createSchedule({
      assetId,
      templateId,
      lastServiceOdometer,
      lastServiceDate: new Date(lastServiceDate),
    });
  }

  @Roles(Role.MECHANIC, Role.MAINTENANCE_ADMIN, Role.FLEET_MANAGER)
  @Post('schedules/:id/perform')
  async performPM(
    @Req() req: any,
    @Param('id') id: string,
    @Body('odometer') odometer: number,
  ) {
    return this.pmService.performPM(id, odometer, req.user.id);
  }
}
