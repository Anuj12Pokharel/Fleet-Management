import { Controller, Get, Post, Delete, Param, Body, UseGuards, Req, UseInterceptors, UploadedFile, BadRequestException, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../enums';

const ALLOWED_MIME = /^(image\/(jpeg|png|webp|heic)|video\/(mp4|quicktime|webm)|application\/pdf)$/;
const MAX_BYTES = 25 * 1024 * 1024;

@ApiTags('Accidents')
@ApiBearerAuth('JWT-Auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api')
export class AccidentsController {
  constructor(private prisma: PrismaService) {}

  @Get('accidents')
  @ApiOperation({ summary: 'List accident claims', description: 'Returns all logged accident claims with driver statements, third-party info, insurance payouts, and photo/video evidence.' })
  @ApiResponse({ status: 200, description: 'Accident claims retrieved.' })
  async getAccidents() {
    return this.prisma.accidentClaim.findMany({
      include: {
        asset: true,
        driver: { select: { id: true, name: true } },
        evidence: { orderBy: { createdAt: 'desc' } },
      },
      orderBy: { claimDate: 'desc' },
    });
  }

  @Roles(Role.DRIVER, Role.MAINTENANCE_ADMIN, Role.FLEET_MANAGER)
  @Post('accidents/:id/evidence')
  @ApiOperation({ summary: 'Upload accident evidence', description: 'Uploads accident scene photos, dashcam video clips, or police accident reports.' })
  @ApiParam({ name: 'id', description: 'Accident Claim ID' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        kind: { type: 'string', enum: ['PHOTO', 'VIDEO', 'REPORT', 'OTHER'], example: 'PHOTO' },
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Evidence uploaded.' })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_BYTES } }))
  async uploadEvidence(@Req() req: any, @Param('id') id: string, @Body('kind') kind: string, @UploadedFile() file: any) {
    if (!file) throw new BadRequestException('No file received (multipart field name must be "file")');
    if (!ALLOWED_MIME.test(file.mimetype)) throw new BadRequestException(`Unsupported file type ${file.mimetype}`);
    const claim = await this.prisma.accidentClaim.findUnique({ where: { id } });
    if (!claim) throw new NotFoundException('Claim not found');

    const dir = path.join(__dirname, '..', '..', 'uploads', 'claims');
    fs.mkdirSync(dir, { recursive: true });
    const ext = (path.extname(file.originalname) || '').toLowerCase().replace(/[^.a-z0-9]/g, '');
    const fileName = `${randomUUID()}${ext}`;
    fs.writeFileSync(path.join(dir, fileName), file.buffer);

    const inferred = file.mimetype.startsWith('image/') ? 'PHOTO' : file.mimetype.startsWith('video/') ? 'VIDEO' : 'REPORT';
    return this.prisma.claimEvidence.create({
      data: {
        claimId: id,
        kind: ['PHOTO', 'VIDEO', 'REPORT', 'OTHER'].includes(kind) ? kind : inferred,
        fileName,
        originalName: path.basename(file.originalname).slice(0, 200),
        mimeType: file.mimetype,
        size: file.size,
        url: `/uploads/claims/${fileName}`,
        uploadedById: req.user.id,
      },
    });
  }

  @Roles(Role.MAINTENANCE_ADMIN, Role.FLEET_MANAGER)
  @Delete('accidents/evidence/:evidenceId')
  @ApiOperation({ summary: 'Delete accident evidence', description: 'Permanently removes an uploaded evidence file.' })
  @ApiParam({ name: 'evidenceId', description: 'Evidence item ID' })
  @ApiResponse({ status: 200, description: 'Evidence deleted.' })
  async deleteEvidence(@Param('evidenceId') evidenceId: string) {
    const ev = await this.prisma.claimEvidence.findUnique({ where: { id: evidenceId } });
    if (!ev) throw new NotFoundException('Evidence not found');
    fs.rmSync(path.join(__dirname, '..', '..', 'uploads', 'claims', ev.fileName), { force: true });
    await this.prisma.claimEvidence.delete({ where: { id: evidenceId } });
    return { deleted: true };
  }

  @Roles(Role.DRIVER, Role.MAINTENANCE_ADMIN, Role.FLEET_MANAGER)
  @Post('accidents')
  @ApiOperation({ summary: 'Create accident claim', description: 'Records an incident, police report number, driver account, and estimated or actual damage costs.' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['assetId', 'policeReportNumber', 'statement', 'thirdPartyDetails', 'claimDate'],
      properties: {
        assetId: { type: 'string', example: 'asset_123' },
        policeReportNumber: { type: 'string', example: 'TX-PD-2026-99214' },
        statement: { type: 'string', example: 'Vehicle stopped in highway traffic when rear-ended by passenger car.' },
        thirdPartyDetails: { type: 'string', example: 'Jane Doe (State Farm Policy #SF-88912), 2022 Honda Civic' },
        claimDate: { type: 'string', format: 'date-time', example: '2026-10-28T09:15:00Z' },
        insurancePayout: { type: 'number', example: 4500.00 },
        actualRepairCost: { type: 'number', example: 5200.00 },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Claim created.' })
  async createClaim(
    @Req() req: any,
    @Body('assetId') assetId: string,
    @Body('policeReportNumber') policeReportNumber: string,
    @Body('statement') statement: string,
    @Body('thirdPartyDetails') thirdPartyDetails: string,
    @Body('claimDate') claimDate: string,
    @Body('insurancePayout') insurancePayout?: number,
    @Body('actualRepairCost') actualRepairCost?: number,
  ) {
    return this.prisma.accidentClaim.create({
      data: {
        assetId,
        driverId: req.user.id,
        policeReportNumber,
        statement,
        thirdPartyDetails,
        claimDate: new Date(claimDate),
        insurancePayout: Number(insurancePayout) || 0,
        actualRepairCost: Number(actualRepairCost) || 0,
        status: 'OPEN',
      },
    });
  }

  // Insurance cost analysis
  @Roles(Role.MAINTENANCE_ADMIN, Role.FLEET_MANAGER)
  @Get('accidents/analytics')
  @ApiOperation({ summary: 'Accident insurance financial analytics', description: 'Computes net financial impact: insurance payouts vs actual collision repair costs grouped per asset.' })
  @ApiResponse({ status: 200, description: 'Analytics breakdown returned.' })
  async getClaimAnalytics() {
    const claims = await this.prisma.accidentClaim.findMany({
      include: { asset: true },
    });

    const analyticsMap: Record<string, {
      assetName: string;
      claimsCount: number;
      totalPayouts: number;
      totalRepairCosts: number;
      netFinancialImpact: number;
    }> = {};

    claims.forEach(claim => {
      const assetId = claim.assetId;
      if (!analyticsMap[assetId]) {
        analyticsMap[assetId] = {
          assetName: claim.asset.name,
          claimsCount: 0,
          totalPayouts: 0,
          totalRepairCosts: 0,
          netFinancialImpact: 0,
        };
      }

      analyticsMap[assetId].claimsCount += 1;
      analyticsMap[assetId].totalPayouts += claim.insurancePayout;
      analyticsMap[assetId].totalRepairCosts += claim.actualRepairCost;
      analyticsMap[assetId].netFinancialImpact = analyticsMap[assetId].totalRepairCosts - analyticsMap[assetId].totalPayouts;
    });

    return Object.values(analyticsMap);
  }
}
