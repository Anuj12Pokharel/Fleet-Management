import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam, ApiBody } from '@nestjs/swagger';
import { IssuesService } from './issues.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Issues')
@ApiBearerAuth('JWT-Auth')
@UseGuards(JwtAuthGuard)
@Controller('api/issues')
export class IssuesController {
  constructor(private readonly issuesService: IssuesService) {}

  @Get()
  @ApiOperation({ summary: 'List reported vehicle issues', description: 'Returns open and resolved driver defect tickets, pre-trip issues, and warnings.' })
  @ApiQuery({ name: 'assetId', required: false })
  @ApiResponse({ status: 200, description: 'Issues list.' })
  async getAll(@Query('assetId') assetId?: string) {
    return this.issuesService.findAll(assetId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get issue by ID', description: 'Returns specific defect details.' })
  @ApiParam({ name: 'id', description: 'Issue ID' })
  @ApiResponse({ status: 200, description: 'Issue details.' })
  async getOne(@Param('id') id: string) {
    return this.issuesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Report new issue', description: 'Opens a new vehicle defect ticket.' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['assetId', 'title'],
      properties: {
        assetId: { type: 'string', example: 'asset_123' },
        title: { type: 'string', example: 'Driver side windshield wiper blade torn' },
        description: { type: 'string', example: 'Streaking heavily during rain.' },
        priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], example: 'MEDIUM' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Issue created.' })
  async create(@Body() body: any) {
    return this.issuesService.create(body);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update issue status', description: 'Updates status (OPEN, IN_PROGRESS, RESOLVED, CLOSED) or links to work order.' })
  @ApiParam({ name: 'id', description: 'Issue ID' })
  @ApiResponse({ status: 200, description: 'Issue updated.' })
  async update(@Param('id') id: string, @Body() body: any) {
    return this.issuesService.update(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete issue', description: 'Deletes an issue ticket.' })
  @ApiParam({ name: 'id', description: 'Issue ID' })
  @ApiResponse({ status: 200, description: 'Issue deleted.' })
  async delete(@Param('id') id: string) {
    return this.issuesService.delete(id);
  }
}
