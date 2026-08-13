import { Controller, Get, Post, Put, Body, Param, UseGuards, Req, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
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

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api')
export class WorkordersController {
  constructor(private workordersService: WorkordersService) {}

  // SERVICE REQUESTS
  @Get('service-requests')
  async getRequests() {
    return this.workordersService.findAllRequests();
  }

  @Roles(Role.DRIVER, Role.MAINTENANCE_ADMIN, Role.FLEET_MANAGER)
  @Post('service-requests')
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
  async getWorkOrders() {
    return this.workordersService.findAllWorkOrders();
  }

  @Roles(Role.MECHANIC, Role.MAINTENANCE_ADMIN, Role.FLEET_MANAGER)
  @Put('work-orders/:id')
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

  // PURCHASE ORDERS
  @Roles(Role.MAINTENANCE_ADMIN, Role.FLEET_MANAGER)
  @Get('purchase-orders')
  async getPurchaseOrders() {
    return this.workordersService.findAllPurchaseOrders();
  }

  // FILE UPLOAD HANDLER
  @Post('upload')
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
    // Return the accessible static URL of the file
    // In dev mode we serve static files from '/uploads'
    return {
      url: `/uploads/${file.filename}`,
      filename: file.filename,
      mimetype: file.mimetype,
      size: file.size,
    };
  }
}
