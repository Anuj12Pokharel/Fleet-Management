import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam, ApiBody } from '@nestjs/swagger';
import { WarrantiesService } from './warranties.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Warranties')
@ApiBearerAuth('JWT-Auth')
@UseGuards(JwtAuthGuard)
@Controller('api/warranties')
export class WarrantiesController {
  constructor(private readonly warrantiesService: WarrantiesService) {}

  @Get()
  @ApiOperation({ summary: 'List asset warranties', description: 'Returns OEM powertrain, emissions, and component warranties with mileage/time expiration limits.' })
  @ApiQuery({ name: 'assetId', required: false })
  @ApiResponse({ status: 200, description: 'Warranties list.' })
  async getAll(@Query('assetId') assetId?: string) {
    return this.warrantiesService.findAll(assetId);
  }

  @Post()
  @ApiOperation({ summary: 'Register warranty coverage', description: 'Attaches OEM or aftermarket warranty policy coverage to a tractor or trailer.' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['assetId', 'provider', 'type'],
      properties: {
        assetId: { type: 'string', example: 'asset_123' },
        provider: { type: 'string', example: 'Detroit Diesel / Freightliner' },
        type: { type: 'string', example: 'Powertrain Extended Warranty' },
        maxMileage: { type: 'number', example: 500000 },
        expiresAt: { type: 'string', format: 'date-time', example: '2028-06-30T00:00:00Z' },
        deductible: { type: 'number', example: 250 },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Warranty saved.' })
  async create(@Body() body: any) {
    return this.warrantiesService.create(body);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update warranty policy', description: 'Updates warranty terms or claim limits.' })
  @ApiParam({ name: 'id', description: 'Warranty ID' })
  @ApiResponse({ status: 200, description: 'Warranty updated.' })
  async update(@Param('id') id: string, @Body() body: any) {
    return this.warrantiesService.update(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete warranty', description: 'Deletes warranty record.' })
  @ApiParam({ name: 'id', description: 'Warranty ID' })
  @ApiResponse({ status: 200, description: 'Warranty deleted.' })
  async delete(@Param('id') id: string) {
    return this.warrantiesService.delete(id);
  }
}
