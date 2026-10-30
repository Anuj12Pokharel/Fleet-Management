import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class WarrantiesService {
  constructor(private prisma: PrismaService) {}

  async findAll(assetId?: string) {
    if (assetId) {
      return this.prisma.warranty.findMany({
        where: { assetId },
        orderBy: { expiryDate: 'asc' },
      });
    }
    return this.prisma.warranty.findMany({
      orderBy: { expiryDate: 'asc' },
    });
  }

  async create(data: {
    assetId: string;
    componentName: string;
    provider: string;
    warrantyNumber: string;
    startDate: string | Date;
    expiryDate: string | Date;
    coverageDetails: string;
    status?: string;
  }) {
    return this.prisma.warranty.create({
      data: {
        assetId: data.assetId,
        componentName: data.componentName,
        provider: data.provider,
        warrantyNumber: data.warrantyNumber,
        startDate: new Date(data.startDate),
        expiryDate: new Date(data.expiryDate),
        coverageDetails: data.coverageDetails,
        status: data.status || 'ACTIVE',
      },
    });
  }

  async update(id: string, data: any) {
    const updateData = { ...data };
    if (updateData.startDate) updateData.startDate = new Date(updateData.startDate);
    if (updateData.expiryDate) updateData.expiryDate = new Date(updateData.expiryDate);
    return this.prisma.warranty.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: string) {
    return this.prisma.warranty.delete({ where: { id } });
  }
}
