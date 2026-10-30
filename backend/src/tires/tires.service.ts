import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class TiresService {
  constructor(private prisma: PrismaService) {}

  async findAll(assetId?: string) {
    if (assetId) {
      return this.prisma.tireReading.findMany({
        where: { assetId },
        orderBy: { recordedAt: 'desc' },
      });
    }
    return this.prisma.tireReading.findMany({
      orderBy: { recordedAt: 'desc' },
    });
  }

  async create(data: {
    assetId: string;
    axlePosition: string;
    tireBrand: string;
    psi: number;
    treadDepth: number;
    recordedAt?: string | Date;
    recordedBy: string;
  }) {
    return this.prisma.tireReading.create({
      data: {
        assetId: data.assetId,
        axlePosition: data.axlePosition,
        tireBrand: data.tireBrand,
        psi: Number(data.psi),
        treadDepth: Number(data.treadDepth),
        recordedAt: data.recordedAt ? new Date(data.recordedAt) : new Date(),
        recordedBy: data.recordedBy,
      },
    });
  }

  async delete(id: string) {
    return this.prisma.tireReading.delete({ where: { id } });
  }
}
