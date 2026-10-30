import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';
import { PartsService } from './parts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../enums';

@ApiTags('Parts')
@ApiBearerAuth('JWT-Auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/parts')
export class PartsController {
  constructor(private partsService: PartsService) {}

  // ─── PARTS INVENTORY ───────────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'List all inventory parts', description: 'Returns parts in stock with quantity on hand, unit cost, SKU, and bin location.' })
  @ApiResponse({ status: 200, description: 'Parts list.' })
  async findAll() {
    return this.partsService.getAllParts();
  }

  @Get('locations')
  @ApiOperation({ summary: 'List warehouse / shop locations', description: 'Returns storage facilities and parts room aisles.' })
  @ApiResponse({ status: 200, description: 'Locations list.' })
  async getLocations() {
    return this.partsService.getAllLocations();
  }

  @Roles(Role.MAINTENANCE_ADMIN, Role.FLEET_MANAGER)
  @Post('locations')
  @ApiOperation({ summary: 'Create storage location', description: 'Defines a new shop inventory shelf or bin location.' })
  @ApiResponse({ status: 201, description: 'Location created.' })
  async createLocation(@Body() body: any) {
    return this.partsService.createLocation(body);
  }

  @Get('categories')
  @ApiOperation({ summary: 'List part categories', description: 'Returns categories like Brakes, Electrical, Engine, Suspension, Tires.' })
  @ApiResponse({ status: 200, description: 'Categories list.' })
  async getCategories() {
    return this.partsService.getAllCategories();
  }

  @Roles(Role.MAINTENANCE_ADMIN, Role.FLEET_MANAGER)
  @Post('categories')
  @ApiOperation({ summary: 'Create part category', description: 'Adds a new parts classification.' })
  @ApiResponse({ status: 201, description: 'Category created.' })
  async createCategory(@Body() body: any) {
    return this.partsService.createCategory(body);
  }

  @Get('manufacturers')
  @ApiOperation({ summary: 'List parts manufacturers', description: 'Returns suppliers and OEMs (e.g. Bendix, Donaldson, Fleetguard, Meritor).' })
  @ApiResponse({ status: 200, description: 'Manufacturers list.' })
  async getManufacturers() {
    return this.partsService.getAllManufacturers();
  }

  @Roles(Role.MAINTENANCE_ADMIN, Role.FLEET_MANAGER)
  @Post('manufacturers')
  @ApiOperation({ summary: 'Create manufacturer', description: 'Adds an OEM or aftermarket parts manufacturer.' })
  @ApiResponse({ status: 201, description: 'Manufacturer created.' })
  async createManufacturer(@Body() body: any) {
    return this.partsService.createManufacturer(body);
  }

  @Get('units')
  @ApiOperation({ summary: 'List units of measure', description: 'Returns units like Each, Gallon, Quart, Set, Box.' })
  @ApiResponse({ status: 200, description: 'Units list.' })
  async getUnits() {
    return this.partsService.getAllUnits();
  }

  @Roles(Role.MAINTENANCE_ADMIN, Role.FLEET_MANAGER)
  @Post('units')
  @ApiOperation({ summary: 'Create unit of measure', description: 'Adds a unit of measure.' })
  @ApiResponse({ status: 201, description: 'Unit created.' })
  async createUnit(@Body() body: any) {
    return this.partsService.createUnit(body);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get part by ID', description: 'Returns detailed inventory specifications, stock levels, and reorder point.' })
  @ApiParam({ name: 'id', description: 'Part ID' })
  @ApiResponse({ status: 200, description: 'Part details.' })
  async findOne(@Param('id') id: string) {
    return this.partsService.getPartById(id);
  }

  @Roles(Role.MECHANIC, Role.MAINTENANCE_ADMIN, Role.FLEET_MANAGER)
  @Post()
  @ApiOperation({ summary: 'Create inventory part', description: 'Registers a new SKU into stock with reorder threshold.' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['name', 'partNumber'],
      properties: {
        name: { type: 'string', example: 'Heavy Duty Oil Filter LF9009' },
        partNumber: { type: 'string', example: 'LF9009-FLTG' },
        quantityOnHand: { type: 'number', example: 12 },
        unitCost: { type: 'number', example: 34.50 },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Part created.' })
  async create(@Req() req: any, @Body() data: any) {
    return this.partsService.createPart(data, req.user?.id);
  }

  @Roles(Role.MECHANIC, Role.MAINTENANCE_ADMIN, Role.FLEET_MANAGER)
  @Put(':id')
  @ApiOperation({ summary: 'Update part details', description: 'Updates SKU information or pricing.' })
  @ApiParam({ name: 'id', description: 'Part ID' })
  @ApiResponse({ status: 200, description: 'Part updated.' })
  async update(@Req() req: any, @Param('id') id: string, @Body() data: any) {
    return this.partsService.updatePart(id, data, req.user?.id);
  }

  @Roles(Role.MECHANIC, Role.MAINTENANCE_ADMIN, Role.FLEET_MANAGER)
  @Post(':id/use')
  @ApiOperation({ summary: 'Deduct part stock for repair', description: 'Decrements quantity on hand and links usage to work order.' })
  @ApiParam({ name: 'id', description: 'Part ID' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['qty'],
      properties: {
        qty: { type: 'number', example: 1 },
        workOrderId: { type: 'string', example: 'wo_123' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Stock deducted.' })
  async usePart(
    @Req() req: any,
    @Param('id') id: string,
    @Body('qty') qty: number,
    @Body('workOrderId') workOrderId?: string,
  ) {
    return this.partsService.usePart(id, Number(qty) || 1, workOrderId, req.user?.id);
  }

  @Roles(Role.MECHANIC, Role.MAINTENANCE_ADMIN, Role.FLEET_MANAGER)
  @Post(':id/restock')
  @ApiOperation({ summary: 'Restock inventory quantity', description: 'Increments quantity on hand when a shipment arrives.' })
  @ApiParam({ name: 'id', description: 'Part ID' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['qty'],
      properties: {
        qty: { type: 'number', example: 24 },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Stock replenished.' })
  async restock(
    @Req() req: any,
    @Param('id') id: string,
    @Body('qty') qty: number,
  ) {
    return this.partsService.restockPart(id, Number(qty) || 1, req.user?.id);
  }

  @Roles(Role.MAINTENANCE_ADMIN, Role.FLEET_MANAGER)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete part SKU', description: 'Deletes an obsolete part from inventory.' })
  @ApiParam({ name: 'id', description: 'Part ID' })
  @ApiResponse({ status: 200, description: 'Part deleted.' })
  async delete(@Req() req: any, @Param('id') id: string) {
    return this.partsService.deletePart(id, req.user?.id);
  }
}
