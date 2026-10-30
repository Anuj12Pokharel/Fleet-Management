import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';
import { ContactsService } from './contacts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Contacts')
@ApiBearerAuth('JWT-Auth')
@UseGuards(JwtAuthGuard)
@Controller('api/contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Get()
  @ApiOperation({ summary: 'List contacts & drivers', description: 'Returns company staff, drivers, emergency contacts, and dispatchers.' })
  @ApiResponse({ status: 200, description: 'Contacts retrieved.' })
  async getAll() {
    return this.contactsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get contact by ID', description: 'Returns contact profile details.' })
  @ApiParam({ name: 'id', description: 'Contact ID' })
  @ApiResponse({ status: 200, description: 'Contact details.' })
  async getOne(@Param('id') id: string) {
    return this.contactsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create contact', description: 'Adds a new driver or team member contact with CDL/med card expiration details.' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['name', 'phone'],
      properties: {
        name: { type: 'string', example: 'Bob Driver' },
        phone: { type: 'string', example: '+1 (555) 234-5678' },
        email: { type: 'string', example: 'driver@fleet.com' },
        role: { type: 'string', example: 'DRIVER' },
        cdlNumber: { type: 'string', example: 'TX-DL-9948214' },
        cdlExpiry: { type: 'string', format: 'date-time', example: '2027-05-15T00:00:00Z' },
        medCardExpiry: { type: 'string', format: 'date-time', example: '2027-01-10T00:00:00Z' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Contact created.' })
  async create(@Body() body: any) {
    return this.contactsService.create(body);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update contact', description: 'Updates phone, email, credentials, or licenses.' })
  @ApiParam({ name: 'id', description: 'Contact ID' })
  @ApiResponse({ status: 200, description: 'Contact updated.' })
  async update(@Param('id') id: string, @Body() body: any) {
    return this.contactsService.update(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete contact', description: 'Deletes a contact entry.' })
  @ApiParam({ name: 'id', description: 'Contact ID' })
  @ApiResponse({ status: 200, description: 'Contact deleted.' })
  async delete(@Param('id') id: string) {
    return this.contactsService.delete(id);
  }
}
