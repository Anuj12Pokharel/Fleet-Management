import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam, ApiBody } from '@nestjs/swagger';
import { TiresService } from './tires.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Tires')
@ApiBearerAuth('JWT-Auth')
@UseGuards(JwtAuthGuard)
@Controller('api/tires')
export class TiresController {
  constructor(private readonly tiresService: TiresService) {}

  @Get()
  @ApiOperation({ summary: 'List tire inspection readings', description: 'Returns tire tread depth (32nds of inch) and cold inflation pressure (PSI) across steer, drive, and trailer axles.' })
  @ApiQuery({ name: 'assetId', required: false })
  @ApiResponse({ status: 200, description: 'Tire readings list.' })
  async getAll(@Query('assetId') assetId?: string) {
    return this.tiresService.findAll(assetId);
  }

  @Post()
  @ApiOperation({ summary: 'Record tire reading', description: 'Logs tire tread and pressure. Automatically alerts if steer < 4/32 or drive/trailer < 2/32.' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['assetId', 'treadDepth32nds', 'psi'],
      properties: {
        assetId: { type: 'string', example: 'asset_123' },
        readingDate: { type: 'string', format: 'date-time', example: '2026-10-29T10:00:00Z' },
        tirePosition: { type: 'string', example: 'Left Steer' },
        treadDepth32nds: { type: 'number', example: 10 },
        psi: { type: 'number', example: 105 },
        dotTin: { type: 'string', example: 'DOT B9YR 0224' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Tire reading recorded.' })
  async create(@Body() body: any) {
    return this.tiresService.create(body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete tire reading', description: 'Deletes a tire measurement record.' })
  @ApiParam({ name: 'id', description: 'Tire reading ID' })
  @ApiResponse({ status: 200, description: 'Tire reading deleted.' })
  async delete(@Param('id') id: string) {
    return this.tiresService.delete(id);
  }
}
