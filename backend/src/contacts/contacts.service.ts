import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ContactsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.contact.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const contact = await this.prisma.contact.findUnique({ where: { id } });
    if (!contact) throw new NotFoundException('Contact not found');
    return contact;
  }

  async create(data: {
    userId?: string | null;
    name: string;
    role: string;
    phone: string;
    email: string;
    cdlNumber?: string | null;
    cdlExpiry?: string | Date | null;
    medCardExpiry?: string | Date | null;
    emergencyContactName?: string | null;
    emergencyContactPhone?: string | null;
    avatarInitials?: string;
  }) {
    const initials = data.avatarInitials || data.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    return this.prisma.contact.create({
      data: {
        userId: data.userId || null,
        name: data.name,
        role: data.role,
        phone: data.phone,
        email: data.email,
        cdlNumber: data.cdlNumber || null,
        cdlExpiry: data.cdlExpiry ? new Date(data.cdlExpiry) : null,
        medCardExpiry: data.medCardExpiry ? new Date(data.medCardExpiry) : null,
        emergencyContactName: data.emergencyContactName || null,
        emergencyContactPhone: data.emergencyContactPhone || null,
        avatarInitials: initials,
      },
    });
  }

  async update(id: string, data: any) {
    const updateData = { ...data };
    if (updateData.cdlExpiry) updateData.cdlExpiry = new Date(updateData.cdlExpiry);
    if (updateData.medCardExpiry) updateData.medCardExpiry = new Date(updateData.medCardExpiry);
    return this.prisma.contact.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: string) {
    return this.prisma.contact.delete({ where: { id } });
  }
}
