import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { ReplacementService } from './replacement.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Replacement')
@ApiBearerAuth('JWT-Auth')
@UseGuards(JwtAuthGuard)
@Controller('api/replacement')
export class ReplacementController {
  constructor(private readonly replacementService: ReplacementService) {}

  @Get()
  @ApiOperation({ summary: 'List asset replacement analyses', description: 'Returns lifecycle TCO curves, salvage estimates, and optimal vehicle replacement recommendations.' })
  @ApiResponse({ status: 200, description: 'Replacement analyses returned.' })
  async getAll() {
    return this.replacementService.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Upsert replacement analysis', description: 'Saves economic lifecycle calculation parameters for an asset.' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['assetId'],
      properties: {
        assetId: { type: 'string', example: 'asset_123' },
        estimatedUsefulLifeYears: { type: 'number', example: 5 },
        salvageValue: { type: 'number', example: 25000 },
        recommendedReplacementDate: { type: 'string', format: 'date-time', example: '2028-12-31T00:00:00Z' },
        recommendation: { type: 'string', example: 'RETAIN - Cost per mile below threshold' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Analysis saved.' })
  async upsert(@Body() body: any) {
    return this.replacementService.upsert(body);
  }
}
