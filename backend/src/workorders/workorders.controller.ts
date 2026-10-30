import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { WorkordersService } from './workorders.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role, WorkOrderType, WorkOrderPriority, WorkOrderStatus } from '../enums';

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

@ApiTags('Work Orders')
@ApiBearerAuth('JWT-Auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api')
export class WorkordersController {
  constructor(private workordersService: WorkordersService) {}

  // SERVICE REQUESTS
  @Get('service-requests')
  @ApiOperation({ summary: 'List all service requests', description: 'Returns pending and processed driver maintenance requests.' })
  @ApiResponse({ status: 200, description: 'Service requests retrieved.' })
  async getRequests() {
    return this.workordersService.findAllRequests();
  }

  @Roles(Role.DRIVER, Role.MAINTENANCE_ADMIN, Role.FLEET_MANAGER)
  @Post('service-requests')
  @ApiOperation({ summary: 'Submit driver service request', description: 'Creates a repair request from the road with photo/video attachments.' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['assetId', 'description'],
      properties: {
        assetId: { type: 'string', example: 'asset_123' },
        description: { type: 'string', example: 'High pitched squeal when applying trailer brakes on steep grades.' },
        mediaUrls: { type: 'array', items: { type: 'string' }, example: ['/uploads/photo1.jpg'] },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Service request created.' })
  async createRequest(
    @Req() req: any,
    @Body('assetId') assetId: string,
    @Body('description') description: string,
    @Body('mediaUrls') mediaUrls: string[],
  ) {
    return this.workordersService.createRequest({
      driverId: req.user.id,
      assetId,
      description,
      mediaUrls,
    });
  }

  @Roles(Role.MAINTENANCE_ADMIN, Role.FLEET_MANAGER)
  @Post('service-requests/:id/approve')
  @ApiOperation({ summary: 'Approve service request and generate Work Order', description: 'Promotes a driver repair request into an internal or external shop work order.' })
  @ApiParam({ name: 'id', description: 'Service Request ID' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['type', 'priority', 'description'],
      properties: {
        type: { type: 'string', enum: ['INTERNAL', 'EXTERNAL'], example: 'INTERNAL' },
        priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'EMERGENCY'], example: 'HIGH' },
        description: { type: 'string', example: 'Replace rear axle brake shoes and drums.' },
        assignedMechanicId: { type: 'string', example: 'u3' },
        vendorId: { type: 'string', example: 'v1' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Work order generated.' })
  async approveRequest(
    @Req() req: any,
    @Param('id') id: string,
    @Body('type') type: WorkOrderType,
    @Body('priority') priority: WorkOrderPriority,
    @Body('description') description: string,
    @Body('assignedMechanicId') assignedMechanicId?: string,
    @Body('vendorId') vendorId?: string,
  ) {
    return this.workordersService.approveRequest(id, { type, priority, description, assignedMechanicId, vendorId }, req.user.id);
  }

  // WORK ORDERS
  @Get('work-orders')
  @ApiOperation({ summary: 'List all work orders', description: 'Returns work orders with line item parts, labor records, and status.' })
  @ApiResponse({ status: 200, description: 'Work orders retrieved.' })
  async getWorkOrders() {
    return this.workordersService.findAllWorkOrders();
  }

  @Roles(Role.MAINTENANCE_ADMIN, Role.FLEET_MANAGER, Role.MECHANIC)
  @Post('work-orders')
  @ApiOperation({ summary: 'Directly create work order', description: 'Creates an internal or external shop work order directly.' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['assetId', 'description'],
      properties: {
        assetId: { type: 'string', example: 'asset_123' },
        priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'EMERGENCY'], example: 'MEDIUM' },
        type: { type: 'string', enum: ['INTERNAL', 'EXTERNAL'], example: 'INTERNAL' },
        description: { type: 'string', example: 'Scheduled 50k mile engine coolant flush.' },
        assignedMechanicId: { type: 'string', example: 'u3' },
        vendorId: { type: 'string', example: 'v1' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Work order created.' })
  async createWorkOrder(
    @Req() req: any,
    @Body('assetId') assetId: string,
    @Body('priority') priority: WorkOrderPriority,
    @Body('type') type: WorkOrderType,
    @Body('description') description: string,
    @Body('assignedMechanicId') assignedMechanicId?: string,
    @Body('vendorId') vendorId?: string,
  ) {
    return this.workordersService.createWorkOrder(
      {
        assetId,
        priority: priority || WorkOrderPriority.MEDIUM,
        type: type || WorkOrderType.INTERNAL,
        description,
        assignedMechanicId,
        vendorId,
      },
      req.user.id,
    );
  }

  @Roles(Role.MECHANIC, Role.MAINTENANCE_ADMIN, Role.FLEET_MANAGER)
  @Put('work-orders/:id')
  @ApiOperation({ summary: 'Update work order', description: 'Updates status (OPEN, IN_PROGRESS, COMPLETED), labor costs, parts cost, or mechanic notes.' })
  @ApiParam({ name: 'id', description: 'Work Order ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['OPEN', 'IN_PROGRESS', 'COMPLETED'], example: 'COMPLETED' },
        priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'EMERGENCY'] },
        assignedMechanicId: { type: 'string' },
        vendorId: { type: 'string' },
        description: { type: 'string' },
        laborCost: { type: 'number', example: 250.00 },
        partsCost: { type: 'number', example: 185.50 },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Work order updated.' })
  async updateWorkOrder(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: {
      status?: WorkOrderStatus;
      priority?: WorkOrderPriority;
      assignedMechanicId?: string;
      vendorId?: string;
      description?: string;
      laborCost?: number;
      partsCost?: number;
    },
  ) {
    return this.workordersService.updateWorkOrder(id, body, req.user.id);
  }

  @Roles(Role.MECHANIC, Role.MAINTENANCE_ADMIN, Role.FLEET_MANAGER)
  @Post('work-orders/:id/parts')
  @ApiOperation({ summary: 'Add part to work order', description: 'Deducts part quantity from inventory and attaches line item cost to work order.' })
  @ApiParam({ name: 'id', description: 'Work Order ID' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['partId', 'quantity'],
      properties: {
        partId: { type: 'string', example: 'part_oil_filter' },
        quantity: { type: 'number', example: 2 },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Part added to work order.' })
  async addPartToWorkOrder(
    @Req() req: any,
    @Param('id') id: string,
    @Body('partId') partId: string,
    @Body('quantity') quantity: number,
  ) {
    return this.workordersService.addPartLineItem(id, partId, quantity ?? 1, req.user.id);
  }

  @Roles(Role.MECHANIC, Role.MAINTENANCE_ADMIN, Role.FLEET_MANAGER)
  @Delete('work-orders/parts/:lineItemId')
  @ApiOperation({ summary: 'Remove part line item', description: 'Restores inventory quantity and deducts cost from work order.' })
  @ApiParam({ name: 'lineItemId', description: 'Line item ID' })
  @ApiResponse({ status: 200, description: 'Part line item removed.' })
  async removePartFromWorkOrder(
    @Req() req: any,
    @Param('lineItemId') lineItemId: string,
  ) {
    return this.workordersService.removePartLineItem(lineItemId, req.user.id);
  }

  // PURCHASE ORDERS
  @Roles(Role.MAINTENANCE_ADMIN, Role.FLEET_MANAGER)
  @Get('purchase-orders')
  @ApiOperation({ summary: 'List purchase orders', description: 'Returns all vendor parts/supplies procurement orders.' })
  @ApiResponse({ status: 200, description: 'Purchase orders retrieved.' })
  async getPurchaseOrders() {
    return this.workordersService.findAllPurchaseOrders();
  }

  // FILE UPLOAD HANDLER
  @Post('upload')
  @ApiOperation({ summary: 'Upload file / photo / document', description: 'Uploads repair receipt, photo evidence, or document file.' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'File uploaded and relative URL returned.' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          cb(null, uploadsDir);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
        },
      }),
    }),
  )
  uploadFile(@UploadedFile() file: any) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    return {
      url: `/uploads/${file.filename}`,
      filename: file.filename,
      mimetype: file.mimetype,
      size: file.size,
    };
  }
}
