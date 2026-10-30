import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';
import { AssignmentsService } from './assignments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Assignments')
@ApiBearerAuth('JWT-Auth')
@UseGuards(JwtAuthGuard)
@Controller('api/assignments')
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Get()
  @ApiOperation({ summary: 'List vehicle assignments', description: 'Returns current and historical driver-to-tractor/trailer assignments.' })
  @ApiResponse({ status: 200, description: 'Assignments list.' })
  async getAll() {
    return this.assignmentsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get assignment by ID', description: 'Returns specific assignment details.' })
  @ApiParam({ name: 'id', description: 'Assignment ID' })
  @ApiResponse({ status: 200, description: 'Assignment details.' })
  async getOne(@Param('id') id: string) {
    return this.assignmentsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create assignment', description: 'Assigns a driver to a vehicle or trailer with starting odometer and date.' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['driverId', 'assetId', 'assignedDate'],
      properties: {
        driverId: { type: 'string', example: 'u4' },
        assetId: { type: 'string', example: 'asset_123' },
        assignedDate: { type: 'string', format: 'date-time', example: '2026-10-29T08:00:00Z' },
        startingOdometer: { type: 'number', example: 145000 },
        notes: { type: 'string', example: 'Assigned to dedicated Dallas-Houston run.' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Assignment created.' })
  async create(@Body() body: any) {
    return this.assignmentsService.create(body);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update assignment', description: 'Updates assignment status or records unassign date and ending odometer.' })
  @ApiParam({ name: 'id', description: 'Assignment ID' })
  @ApiResponse({ status: 200, description: 'Assignment updated.' })
  async update(@Param('id') id: string, @Body() body: any) {
    return this.assignmentsService.update(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete assignment', description: 'Deletes an assignment record.' })
  @ApiParam({ name: 'id', description: 'Assignment ID' })
  @ApiResponse({ status: 200, description: 'Assignment deleted.' })
  async delete(@Param('id') id: string) {
    return this.assignmentsService.delete(id);
  }
}
