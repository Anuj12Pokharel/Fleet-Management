import { Controller, Get, Post, Body, Query, Req, UseGuards, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiBody } from '@nestjs/swagger';
import { PrismaService } from '../prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

export type DutyStatus = 'OFF_DUTY' | 'SLEEPER_BERTH' | 'DRIVING' | 'ON_DUTY';
const STATUSES: DutyStatus[] = ['OFF_DUTY', 'SLEEPER_BERTH', 'DRIVING', 'ON_DUTY'];
const MIN = 60 * 1000;

interface Seg { status: string; start: number; end: number }

/**
 * Property-carrying HOS rules (49 CFR 395.3), computed from the stored duty log:
 *  - 11h driving limit and 14h shift window, both reset by 10 consecutive hours off duty/sleeper
 *  - 30-minute break required after 8 cumulative driving hours without a >=30 min non-driving interruption
 *  - 70h / 8-day on-duty cycle
 * Not modelled: split-sleeper provision, adverse driving / short-haul exceptions, 34h restart.
 */
export function computeClocks(rows: { status: string; startedAt: Date; endedAt: Date | null }[], now = Date.now()) {
  const segs: Seg[] = rows
    .map(r => ({ status: r.status, start: r.startedAt.getTime(), end: (r.endedAt ? r.endedAt.getTime() : now) }))
    .filter(s => s.end > s.start)
    .sort((a, b) => a.start - b.start);

  const isRest = (s: string) => s === 'OFF_DUTY' || s === 'SLEEPER_BERTH';

  // Find the end of the most recent block of >= 10 consecutive hours of rest
  let resetAt = segs.length ? segs[0].start : now;
  let blockStart: number | null = null;
  let blockEnd = 0;
  for (const s of segs) {
    if (isRest(s.status)) {
      if (blockStart === null) blockStart = s.start;
      blockEnd = s.end;
      if (blockEnd - blockStart >= 10 * 60 * MIN) resetAt = blockEnd;
    } else {
      blockStart = null;
    }
  }

  const after = segs
    .map(s => ({ ...s, start: Math.max(s.start, resetAt) }))
    .filter(s => s.end > s.start);

  let driveMs = 0;
  let sinceBreakDriveMs = 0;
  let nonDrivingRun = 0;
  let shiftStart: number | null = null;

  for (const s of after) {
    const dur = s.end - s.start;
    if (!isRest(s.status) && shiftStart === null) shiftStart = s.start;
    if (s.status === 'DRIVING') {
      driveMs += dur;
      sinceBreakDriveMs += dur;
      nonDrivingRun = 0;
    } else {
      nonDrivingRun += dur;
      if (nonDrivingRun >= 30 * MIN) sinceBreakDriveMs = 0;
    }
  }

  const shiftElapsed = shiftStart === null ? 0 : now - shiftStart;

  const cycleFrom = now - 8 * 24 * 60 * MIN;
  let cycleMs = 0;
  for (const s of segs) {
    if (isRest(s.status)) continue;
    const st = Math.max(s.start, cycleFrom);
    if (s.end > st) cycleMs += s.end - st;
  }

  const left = (limitHours: number, usedMs: number) => Math.round(limitHours * 60 - usedMs / MIN);
  const driveLeft = left(11, driveMs);
  const shiftLeft = left(14, shiftElapsed);
  const breakLeft = left(8, sinceBreakDriveMs);
  const cycleLeft = left(70, cycleMs);

  return {
    driveMinutesLeft: driveLeft,
    shiftMinutesLeft: shiftLeft,
    breakMinutesLeft: breakLeft,
    cycleMinutesLeft: cycleLeft,
    violations: [
      driveLeft < 0 && '11-hour driving limit exceeded',
      shiftLeft < 0 && '14-hour shift window exceeded',
      breakLeft < 0 && '30-minute break overdue',
      cycleLeft < 0 && '70-hour cycle exceeded',
    ].filter(Boolean) as string[],
  };
}

@ApiTags('HOS')
@ApiBearerAuth('JWT-Auth')
@UseGuards(JwtAuthGuard)
@Controller('api/hos')
export class HosController {
  constructor(private prisma: PrismaService) {}

  private isManager(req: any) {
    return ['FLEET_MANAGER', 'MAINTENANCE_ADMIN'].includes(req.user?.role);
  }

  private targetDriver(req: any, driverId?: string) {
    return driverId && this.isManager(req) ? driverId : req.user.id;
  }

  @Get('logs')
  @ApiOperation({ summary: 'Get driver HOS logs', description: 'Returns electronic logging device (ELD) status duty logs for the specified driver and day range.' })
  @ApiQuery({ name: 'driverId', required: false })
  @ApiQuery({ name: 'days', required: false, example: '8' })
  @ApiResponse({ status: 200, description: 'HOS logs returned.' })
  async logs(@Req() req: any, @Query('driverId') driverId?: string, @Query('days') days = '8') {
    const since = new Date(Date.now() - Math.min(30, Math.max(1, parseInt(days) || 8)) * 24 * 60 * MIN);
    return this.prisma.hosLog.findMany({
      where: { driverId: this.targetDriver(req, driverId), startedAt: { gte: since } },
      orderBy: { startedAt: 'desc' },
    });
  }

  @Get('clocks')
  @ApiOperation({ summary: 'Get current HOS clocks & violations', description: 'Calculates active 11h driving, 14h shift, 30m break, and 70h/8-day cycles under 49 CFR 395.3.' })
  @ApiQuery({ name: 'driverId', required: false })
  @ApiResponse({ status: 200, description: 'Computed HOS clocks and violations returned.' })
  async clocks(@Req() req: any, @Query('driverId') driverId?: string) {
    const id = this.targetDriver(req, driverId);
    const since = new Date(Date.now() - 9 * 24 * 60 * MIN);
    const rows = await this.prisma.hosLog.findMany({
      where: { driverId: id, OR: [{ endedAt: null }, { endedAt: { gte: since } }] },
      orderBy: { startedAt: 'asc' },
    });
    const current = rows.find(r => r.endedAt === null) || null;
    return { driverId: id, currentStatus: current?.status ?? null, since: current?.startedAt ?? null, ...computeClocks(rows) };
  }

  @Post('status')
  @ApiOperation({ summary: 'Update driver duty status', description: 'Transitions driver duty status (OFF_DUTY, SLEEPER_BERTH, DRIVING, ON_DUTY) with GPS location and odometer.' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['status'],
      properties: {
        status: { type: 'string', enum: ['OFF_DUTY', 'SLEEPER_BERTH', 'DRIVING', 'ON_DUTY'], example: 'DRIVING' },
        location: { type: 'string', example: 'Dallas, TX' },
        odometer: { type: 'number', example: 146200 },
        assetId: { type: 'string', example: 'asset_123' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Duty status updated.' })
  async setStatus(
    @Req() req: any,
    @Body('status') status: DutyStatus,
    @Body('location') location?: string,
    @Body('odometer') odometer?: number,
    @Body('assetId') assetId?: string,
  ) {
    if (!STATUSES.includes(status)) throw new BadRequestException(`status must be one of ${STATUSES.join(', ')}`);
    const driverId = req.user.id;
    const now = new Date();

    const open = await this.prisma.hosLog.findFirst({ where: { driverId, endedAt: null }, orderBy: { startedAt: 'desc' } });
    if (open && open.status === status) return open; // no-op
    if (open) await this.prisma.hosLog.update({ where: { id: open.id }, data: { endedAt: now } });

    return this.prisma.hosLog.create({
      data: {
        driverId,
        status,
        startedAt: now,
        location: location || open?.location || '',
        odometer: odometer ?? open?.odometer ?? 0,
        assetId: assetId || open?.assetId || null,
      },
    });
  }

  // Driver certifies all of their own completed/open logs for the given day (default today) - 49 CFR 395.30
  @Post('certify')
  @ApiOperation({ summary: 'Certify daily driver log', description: 'Submits driver digital certification for the 24-hour log period pursuant to 49 CFR 395.30.' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        date: { type: 'string', format: 'date', example: '2026-10-29' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Log certified.' })
  async certify(@Req() req: any, @Body('date') date?: string) {
    const day = date ? new Date(date) : new Date();
    const from = new Date(day); from.setHours(0, 0, 0, 0);
    const to = new Date(from.getTime() + 24 * 60 * MIN);
    const res = await this.prisma.hosLog.updateMany({
      where: { driverId: req.user.id, startedAt: { gte: from, lt: to } },
      data: { certified: true },
    });
    return { certified: res.count };
  }
}
