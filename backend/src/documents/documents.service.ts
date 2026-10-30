import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class DocumentsService {
  constructor(private prisma: PrismaService) {}

  async findAll(assetId?: string) {
    if (assetId) {
      return this.prisma.fleetDocument.findMany({
        where: { assetId },
        orderBy: { uploadedAt: 'desc' },
      });
    }
    return this.prisma.fleetDocument.findMany({
      orderBy: { uploadedAt: 'desc' },
    });
  }

  async create(data: {
    assetId: string;
    name: string;
    type: string;
    fileUrl: string;
    uploadedBy: string;
    expiresAt?: string | Date | null;
  }) {
    return this.prisma.fleetDocument.create({
      data: {
        assetId: data.assetId,
        name: data.name,
        type: data.type,
        fileUrl: data.fileUrl,
        uploadedBy: data.uploadedBy,
        uploadedAt: new Date(),
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      },
    });
  }

  async delete(id: string) {
    return this.prisma.fleetDocument.delete({ where: { id } });
  }
}
