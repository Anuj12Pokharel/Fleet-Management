import { Body, Controller, Delete, ForbiddenException, Get, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ZitadelRenewalAuthGuard } from '../renewals/zitadel-renewal-auth.guard';
import {
  CommentRepairDto,
  ConfirmRepairDto,
  CreateRepairDto,
  ListRepairsQuery,
  PaymentRepairDto,
  RepairActor,
  RepairsService,
  TransitionRepairDto,
  UpdateRepairDto,
} from './repairs.service';

/**
 * Repairs has exactly two roles:
 *  - CARRIER: runs the whole workflow and sees costs
 *  - DRIVER: reports problems on their own truck, follows status, confirms the fix
 * Any other Zitadel group (dispatcher, accountant, tracking agent...) has no access.
 */
const resolveActor = (req: any): RepairActor => {
  const u = req.user || {};
  const groups: string[] = (u.groups || []).map((g: string) => String(g).toLowerCase());
  let role: RepairActor['role'];
  if (groups.includes('carrier') || groups.includes('super_admin') || groups.includes('admin')) role = 'CARRIER';
  else if (groups.includes('driver')) role = 'DRIVER';
  else throw new ForbiddenException('Repairs is available to carriers and drivers only');
  return { id: String(u.id), name: u.name || u.email || 'User', email: u.email, role, tenantId: String(u.tenantId || '') };
};

@ApiTags('Repairs')
@ApiBearerAuth('JWT-Auth')
@UseGuards(ZitadelRenewalAuthGuard)
@Controller('api/repairs')
export class RepairsController {
  constructor(private readonly repairs: RepairsService) {}

  @Get()
  @ApiOperation({ summary: 'List repairs', description: 'Carrier: all repairs for the carrier. Driver: only their own requests.' })
  list(@Request() req: any, @Query() q: ListRepairsQuery) {
    return this.repairs.list(resolveActor(req), q);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Repairs KPI summary (carrier only)' })
  summary(@Request() req: any) {
    return this.repairs.summary(resolveActor(req));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one repair with its timeline' })
  get(@Request() req: any, @Param('id') id: string) {
    return this.repairs.get(resolveActor(req), id);
  }

  @Post()
  @ApiOperation({ summary: 'Report a problem (driver) or create a repair (carrier)' })
  create(@Request() req: any, @Body() dto: CreateRepairDto) {
    return this.repairs.create(resolveActor(req), dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Edit repair details and costs (carrier only)' })
  update(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateRepairDto) {
    return this.repairs.update(resolveActor(req), id, dto);
  }

  @Post(':id/transition')
  @ApiOperation({ summary: 'Move a repair to the next status (carrier only)' })
  transition(@Request() req: any, @Param('id') id: string, @Body() dto: TransitionRepairDto) {
    return this.repairs.transition(resolveActor(req), id, dto);
  }

  @Post(':id/comment')
  @ApiOperation({ summary: 'Add a note. Drivers can only add public notes on their own repairs.' })
  comment(@Request() req: any, @Param('id') id: string, @Body() dto: CommentRepairDto) {
    return this.repairs.comment(resolveActor(req), id, dto);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel a repair (driver: own, before it is scheduled)' })
  cancel(@Request() req: any, @Param('id') id: string) {
    return this.repairs.cancel(resolveActor(req), id);
  }

  @Post(':id/confirm')
  @ApiOperation({ summary: 'Driver confirms the truck is fixed, or reports it is not' })
  confirm(@Request() req: any, @Param('id') id: string, @Body() dto: ConfirmRepairDto) {
    return this.repairs.confirm(resolveActor(req), id, dto);
  }

  @Post(':id/payment')
  @ApiOperation({ summary: 'Record whether the vendor has been paid (carrier only)' })
  payment(@Request() req: any, @Param('id') id: string, @Body() dto: PaymentRepairDto) {
    return this.repairs.setPayment(resolveActor(req), id, dto);
  }
}
