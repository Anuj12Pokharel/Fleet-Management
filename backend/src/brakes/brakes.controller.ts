import { Controller, Get, Post, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam, ApiBody } from '@nestjs/swagger';
import { BrakesService } from './brakes.service';

@ApiTags('Brakes')
@Controller('api/brakes')
export class BrakesController {
  constructor(private readonly brakesService: BrakesService) {}

  @Get()
  @ApiOperation({ summary: 'List brake inspection readings', description: 'Returns brake shoe lining thickness and drum measurements by asset.' })
  @ApiQuery({ name: 'assetId', required: false })
  @ApiResponse({ status: 200, description: 'Brake readings list.' })
  findAll(@Query('assetId') assetId?: string) {
    return this.brakesService.findAll(assetId);
  }

  @Post()
  @ApiOperation({ summary: 'Record brake measurement', description: 'Logs lining thickness in 32nds of an inch across steer, drive, and trailer axles.' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['assetId'],
      properties: {
        assetId: { type: 'string', example: 'asset_123' },
        readingDate: { type: 'string', format: 'date-time', example: '2026-10-29T10:00:00Z' },
        axlePosition: { type: 'string', example: 'Front Steer Left' },
        liningThickness32nds: { type: 'number', example: 12 },
        drumCondition: { type: 'string', example: 'GOOD' },
        notes: { type: 'string', example: 'Within legal tolerance (>4/32 on steer).' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Brake reading recorded.' })
  create(@Body() body: any) {
    return this.brakesService.create(body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete brake reading', description: 'Deletes a brake inspection record.' })
  @ApiParam({ name: 'id', description: 'Brake reading ID' })
  @ApiResponse({ status: 200, description: 'Brake reading deleted.' })
  delete(@Param('id') id: string) {
    return this.brakesService.delete(id);
  }
}
