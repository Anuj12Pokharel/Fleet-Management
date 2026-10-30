import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PrismaService } from '../prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../enums';
import { computeClocks } from '../hos/hos.controller';

const DAY = 24 * 60 * 60 * 1000;

function band(pct: number, threshold: number) {
  if (pct >= threshold) return 'ALERT';
  if (pct >= threshold * 0.6) return 'WATCH';
  return 'OK';
}

/**
 * Internal fleet risk indices computed from this system's own data.
 * These are NOT official FMCSA SMS percentiles (those are peer-group ranked by FMCSA);
 * they are a transparent proxy so the scorecard always reflects live operational data.
 */
@ApiTags('Safety')
@ApiBearerAuth('JWT-Auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.MAINTENANCE_ADMIN, Role.FLEET_MANAGER)
@Controller('api/safety')
export class SafetyController {
  constructor(private prisma: PrismaService) {}

  @Get('scorecard')
  @ApiOperation({ summary: 'Fleet safety risk scorecard', description: 'Calculates internal safety scores across Vehicle Maintenance, Crash Frequency, HOS Compliance, Roadside Inspections, and Insurance/Registration.' })
  @ApiResponse({ status: 200, description: 'Safety index and tier metrics.' })
  async scorecard() {
    const now = Date.now();
    const since24m = new Date(now - 730 * DAY);
    const since90 = new Date(now - 90 * DAY);

    const [assets, dot, claims, inspections, renewals, hosRows, drivers] = await Promise.all([
      this.prisma.asset.findMany(),
      this.prisma.dOTInspection.findMany({ where: { inspectionDate: { gte: since24m } } }),
      this.prisma.accidentClaim.findMany({ where: { claimDate: { gte: since24m } } }),
      this.prisma.eDVIRInspection.findMany({ where: { createdAt: { gte: since90 } } }),
      this.prisma.renewalAlert.findMany(),
      this.prisma.hosLog.findMany({ where: { startedAt: { gte: new Date(now - 9 * DAY) } }, orderBy: { startedAt: 'asc' } }),
      this.prisma.user.findMany({ where: { role: 'DRIVER' }, select: { id: true } }),
    ]);

    const powerUnits = Math.max(1, assets.filter(a => a.type === 'TRACTOR').length);

    // DOT inspections
    const dotTotal = dot.length;
    const dotViolations = dot.filter(i => i.result === 'VIOLATION').length;
    const dotCleanRate = dotTotal ? Math.round(((dotTotal - dotViolations) / dotTotal) * 100) : null;
    const inspectionViolationPct = dotTotal ? (dotViolations / dotTotal) * 100 : 0;

    // Crashes
    const claimCount = claims.length;
    const totalRepair = claims.reduce((s, c) => s + c.actualRepairCost, 0);
    const totalPayout = claims.reduce((s, c) => s + c.insurancePayout, 0);
    const crashesPerUnitYear = claimCount / powerUnits / 2;
    const crashPct = Math.min(100, crashesPerUnitYear * 100);

    // Vehicle maintenance: failed eDVIRs (90d) + units currently not operable
    const failed = inspections.filter(i => i.status === 'FAILED').length;
    const failRate = inspections.length ? (failed / inspections.length) * 100 : 0;
    const notOperable = assets.filter(a => a.status !== 'OPERABLE').length;
    const maintPct = Math.min(100, failRate * 0.6 + (notOperable / Math.max(1, assets.length)) * 100 * 0.4);

    // HOS: any driver currently in violation, plus drivers with live logs
    const byDriver = new Map<string, typeof hosRows>();
    hosRows.forEach(r => { byDriver.set(r.driverId, [...(byDriver.get(r.driverId) || []), r]); });
    let hosViolatingDrivers = 0;
    byDriver.forEach(rows => { if (computeClocks(rows).violations.length) hosViolatingDrivers++; });
    const hosPct = byDriver.size ? (hosViolatingDrivers / byDriver.size) * 100 : 0;

    // Compliance: expired registrations / insurance / annual inspections
    const expired = renewals.filter(r => r.status === 'EXPIRED' || (r.status === 'ACTIVE' && r.expiryDate.getTime() < now)).length;
    const compliancePct = renewals.length ? (expired / renewals.length) * 100 : 0;

    const indices = [
      { key: 'maintenance', label: 'Vehicle Maintenance', pct: Math.round(maintPct), threshold: 80, basis: `${failed} of ${inspections.length} eDVIRs failed (90d); ${notOperable} unit(s) not operable` },
      { key: 'crash', label: 'Crash Frequency', pct: Math.round(crashPct), threshold: 65, basis: `${claimCount} claim(s) across ${powerUnits} power unit(s) in 24 months` },
      { key: 'hos', label: 'HOS Compliance', pct: Math.round(hosPct), threshold: 65, basis: byDriver.size ? `${hosViolatingDrivers} of ${byDriver.size} logged driver(s) currently in violation` : 'No duty logs recorded yet' },
      { key: 'inspection', label: 'Inspection Violations', pct: Math.round(inspectionViolationPct), threshold: 65, basis: `${dotViolations} violation inspection(s) of ${dotTotal} (24 months)` },
      { key: 'compliance', label: 'Registration & Insurance', pct: Math.round(compliancePct), threshold: 50, basis: `${expired} of ${renewals.length} renewal item(s) expired` },
    ].map(i => ({ ...i, status: band(i.pct, i.threshold) }));

    // Weighted score: each index contributes proportionally to how close it is to its alert threshold
    const penalty = indices.reduce((s, i) => s + Math.min(1, i.pct / i.threshold) * 20, 0);
    const safetyIndex = Math.max(0, Math.round(100 - penalty));
    const tier = safetyIndex >= 90 ? 'Preferred' : safetyIndex >= 75 ? 'Standard' : safetyIndex >= 60 ? 'Elevated risk' : 'High risk';

    const policies = renewals
      .filter(r => r.type === 'INSURANCE_POLICY')
      .map(r => ({
        id: r.id,
        description: r.description,
        assetId: r.assetId,
        expiryDate: r.expiryDate,
        daysLeft: Math.ceil((r.expiryDate.getTime() - now) / DAY),
        status: r.expiryDate.getTime() < now || r.status === 'EXPIRED' ? 'EXPIRED' : r.status,
      }))
      .sort((a, b) => a.daysLeft - b.daysLeft);

    return {
      generatedAt: new Date().toISOString(),
      safetyIndex,
      tier,
      powerUnits,
      inspections: { total: dotTotal, violations: dotViolations, cleanRate: dotCleanRate },
      claims: { count: claimCount, totalRepairCost: totalRepair, totalPayout, netLoss: totalRepair - totalPayout, perUnitPerYear: Number(crashesPerUnitYear.toFixed(2)) },
      drivers: { total: drivers.length, withHosLogs: byDriver.size },
      indices,
      policies,
    };
  }
}
