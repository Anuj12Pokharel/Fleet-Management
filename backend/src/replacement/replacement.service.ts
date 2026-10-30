import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ReplacementService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.replacementAnalysis.findMany();
  }

  async upsert(data: {
    assetId: string;
    purchasePrice: number;
    purchaseDate: string | Date;
    lifetimeCostToDate: number;
    estimatedCurrentValue: number;
    recommendation: string;
  }) {
    return this.prisma.replacementAnalysis.upsert({
      where: { assetId: data.assetId },
      update: {
        purchasePrice: Number(data.purchasePrice),
        purchaseDate: new Date(data.purchaseDate),
        lifetimeCostToDate: Number(data.lifetimeCostToDate),
        estimatedCurrentValue: Number(data.estimatedCurrentValue),
        recommendation: data.recommendation,
      },
      create: {
        assetId: data.assetId,
        purchasePrice: Number(data.purchasePrice),
        purchaseDate: new Date(data.purchaseDate),
        lifetimeCostToDate: Number(data.lifetimeCostToDate),
        estimatedCurrentValue: Number(data.estimatedCurrentValue),
        recommendation: data.recommendation,
      },
    });
  }
}
