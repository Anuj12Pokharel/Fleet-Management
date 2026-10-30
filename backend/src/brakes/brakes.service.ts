import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class BrakesService {
  constructor(private prisma: PrismaService) {}

  async findAll(assetId?: string) {
    if (assetId) {
      return (this.prisma as any).brakeReading.findMany({
        where: { assetId },
        orderBy: { recordedAt: 'desc' },
      });
    }
    return (this.prisma as any).brakeReading.findMany({
      orderBy: { recordedAt: 'desc' },
    });
  }

  async create(data: {
    assetId: string;
    axlePosition: string;
    brakeType?: string;
    liningThickness: number;
    pushrodStroke: number;
    drumCondition?: string;
    brakeTemp?: number;
    recordedAt?: string | Date;
    recordedBy: string;
  }) {
    return (this.prisma as any).brakeReading.create({
      data: {
        assetId: data.assetId,
        axlePosition: data.axlePosition,
        brakeType: data.brakeType || 'DRUM',
        liningThickness: Number(data.liningThickness),
        pushrodStroke: Number(data.pushrodStroke),
        drumCondition: data.drumCondition || 'GOOD',
        brakeTemp: data.brakeTemp ? Number(data.brakeTemp) : null,
        recordedAt: data.recordedAt ? new Date(data.recordedAt) : new Date(),
        recordedBy: data.recordedBy,
      },
    });
  }

  async delete(id: string) {
    return (this.prisma as any).brakeReading.delete({ where: { id } });
  }
}
