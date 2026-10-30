import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';
import { PlacesService } from './places.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Places')
@ApiBearerAuth('JWT-Auth')
@UseGuards(JwtAuthGuard)
@Controller('api/places')
export class PlacesController {
  constructor(private readonly placesService: PlacesService) {}

  @Get()
  @ApiOperation({ summary: 'List saved places & geofences', description: 'Returns terminals, distribution hubs, customer yards, and maintenance facilities.' })
  @ApiResponse({ status: 200, description: 'Places list.' })
  async getAll() {
    return this.placesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get place by ID', description: 'Returns place coordinates and contact information.' })
  @ApiParam({ name: 'id', description: 'Place ID' })
  @ApiResponse({ status: 200, description: 'Place details.' })
  async getOne(@Param('id') id: string) {
    return this.placesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create saved place', description: 'Creates a yard or terminal location with GPS coordinates.' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['name', 'address'],
      properties: {
        name: { type: 'string', example: 'Dallas Main Hub Terminal' },
        address: { type: 'string', example: '1020 Logistics Blvd, Dallas, TX 75201' },
        latitude: { type: 'number', example: 32.7767 },
        longitude: { type: 'number', example: -96.7970 },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Place created.' })
  async create(@Body() body: any) {
    return this.placesService.create(body);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update place', description: 'Updates place address or geofence boundary.' })
  @ApiParam({ name: 'id', description: 'Place ID' })
  @ApiResponse({ status: 200, description: 'Place updated.' })
  async update(@Param('id') id: string, @Body() body: any) {
    return this.placesService.update(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete place', description: 'Deletes a saved location.' })
  @ApiParam({ name: 'id', description: 'Place ID' })
  @ApiResponse({ status: 200, description: 'Place deleted.' })
  async delete(@Param('id') id: string) {
    return this.placesService.delete(id);
  }
}
