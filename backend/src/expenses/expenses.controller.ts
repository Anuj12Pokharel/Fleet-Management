import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam, ApiBody } from '@nestjs/swagger';
import { ExpensesService } from './expenses.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Expenses')
@ApiBearerAuth('JWT-Auth')
@UseGuards(JwtAuthGuard)
@Controller('api/expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get()
  @ApiOperation({ summary: 'List operating expenses', description: 'Returns fuel, toll, parts, maintenance, and administrative expenses.' })
  @ApiQuery({ name: 'assetId', required: false })
  @ApiResponse({ status: 200, description: 'Expenses list.' })
  async getAll(@Query('assetId') assetId?: string) {
    return this.expensesService.findAll(assetId);
  }

  @Post()
  @ApiOperation({ summary: 'Record expense', description: 'Logs a new operating expense entry with receipt or work order link.' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['assetId', 'amount', 'category'],
      properties: {
        assetId: { type: 'string', example: 'asset_123' },
        amount: { type: 'number', example: 175.50 },
        category: { type: 'string', example: 'MAINTENANCE' },
        description: { type: 'string', example: 'Coolant refill and DEF at travel plaza' },
        date: { type: 'string', format: 'date-time', example: '2026-10-29T12:00:00Z' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Expense recorded.' })
  async create(@Body() body: any) {
    return this.expensesService.create(body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete expense', description: 'Deletes an expense record.' })
  @ApiParam({ name: 'id', description: 'Expense ID' })
  @ApiResponse({ status: 200, description: 'Expense deleted.' })
  async delete(@Param('id') id: string) {
    return this.expensesService.delete(id);
  }
}
