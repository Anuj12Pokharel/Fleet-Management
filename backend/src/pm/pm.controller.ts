import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';
import { PmService } from './pm.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../enums';

@ApiTags('PM')
@ApiBearerAuth('JWT-Auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/pm')
export class PmController {
  constructor(private pmService: PmService) {}

  @Get('templates')
  @ApiOperation({ summary: 'List PM templates', description: 'Returns preventive maintenance interval templates (e.g. Service A - 15k mi, Service B - 30k mi, Annual DOT).' })
  @ApiResponse({ status: 200, description: 'Templates retrieved.' })
  async getTemplates() {
    return this.pmService.findAllTemplates();
  }

  @Roles(Role.MAINTENANCE_ADMIN, Role.FLEET_MANAGER)
  @Post('templates')
  @ApiOperation({ summary: 'Create PM template', description: 'Creates a custom dual-trigger (mileage + days) PM maintenance checklist template.' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['name', 'description', 'triggerMileage', 'triggerDays', 'stepsJson'],
      properties: {
        name: { type: 'string', example: 'Dry Van Annual Trailer Service' },
        description: { type: 'string', example: 'Wheel seal, brake lining, gladhand and floor check' },
        triggerMileage: { type: 'number', example: 25000 },
        triggerDays: { type: 'number', example: 180 },
        stepsJson: { type: 'array', items: { type: 'string' }, example: ['Check air lines', 'Torque lug nuts', 'Grease kingpin'] },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Template created.' })
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
  @ApiOperation({ summary: 'List PM schedules for all assets', description: 'Returns assets with their next service due date, next service mileage, and status (COMPLIANT, DUE, OVERDUE).' })
  @ApiResponse({ status: 200, description: 'PM schedules retrieved.' })
  async getSchedules() {
    return this.pmService.findAllSchedules();
  }

  @Roles(Role.MAINTENANCE_ADMIN, Role.FLEET_MANAGER)
  @Post('schedules')
  @ApiOperation({ summary: 'Attach PM schedule to asset', description: 'Enrolls an asset into a recurring PM template track.' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['assetId', 'templateId', 'lastServiceOdometer', 'lastServiceDate'],
      properties: {
        assetId: { type: 'string', example: 'asset_123' },
        templateId: { type: 'string', example: 'tmpl_456' },
        lastServiceOdometer: { type: 'number', example: 120000 },
        lastServiceDate: { type: 'string', format: 'date-time', example: '2026-08-01T00:00:00Z' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'PM schedule created.' })
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
  @ApiOperation({ summary: 'Log PM service completion', description: 'Records that a PM service was completed, resets the mileage/day counter, and advances the schedule.' })
  @ApiParam({ name: 'id', description: 'PM Schedule ID' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['odometer'],
      properties: {
        odometer: { type: 'number', example: 145000 },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'PM completion recorded and schedule advanced.' })
  async performPM(
    @Req() req: any,
    @Param('id') id: string,
    @Body('odometer') odometer: number,
  ) {
    return this.pmService.performPM(id, odometer, req.user.id);
  }
}
