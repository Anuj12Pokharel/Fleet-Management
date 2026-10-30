import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam, ApiBody } from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Documents')
@ApiBearerAuth('JWT-Auth')
@UseGuards(JwtAuthGuard)
@Controller('api/documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get()
  @ApiOperation({ summary: 'List fleet documents', description: 'Returns registrations, insurance binders, title scans, lease contracts, and annual certificates.' })
  @ApiQuery({ name: 'assetId', required: false })
  @ApiResponse({ status: 200, description: 'Documents list.' })
  async getAll(@Query('assetId') assetId?: string) {
    return this.documentsService.findAll(assetId);
  }

  @Post()
  @ApiOperation({ summary: 'Save document reference', description: 'Attaches a document metadata record with expiration date to an asset.' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['name', 'type', 'fileUrl'],
      properties: {
        assetId: { type: 'string', example: 'asset_123' },
        name: { type: 'string', example: 'Texas Commercial Vehicle Registration 2026-2027' },
        type: { type: 'string', enum: ['REGISTRATION', 'INSURANCE_CARD', 'INSPECTION_CERT', 'TITLE', 'LEASE_AGREEMENT', 'OTHER'], example: 'REGISTRATION' },
        fileUrl: { type: 'string', example: '/uploads/reg_trk104.pdf' },
        expiresAt: { type: 'string', format: 'date-time', example: '2027-06-30T00:00:00Z' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Document record saved.' })
  async create(@Body() body: any) {
    return this.documentsService.create(body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete document', description: 'Deletes a document record.' })
  @ApiParam({ name: 'id', description: 'Document ID' })
  @ApiResponse({ status: 200, description: 'Document deleted.' })
  async delete(@Param('id') id: string) {
    return this.documentsService.delete(id);
  }
}
