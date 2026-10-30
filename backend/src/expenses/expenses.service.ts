import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ExpensesService {
  constructor(private prisma: PrismaService) {}

  async findAll(assetId?: string) {
    if (assetId) {
      return this.prisma.expenseRecord.findMany({
        where: { assetId },
        orderBy: { date: 'desc' },
      });
    }
    return this.prisma.expenseRecord.findMany({
      orderBy: { date: 'desc' },
    });
  }

  async create(data: {
    assetId: string;
    category: string;
    amount: number;
    description: string;
    date?: string | Date;
    linkedWoId?: string | null;
  }) {
    return this.prisma.expenseRecord.create({
      data: {
        assetId: data.assetId,
        category: data.category,
        amount: Number(data.amount),
        description: data.description,
        date: data.date ? new Date(data.date) : new Date(),
        linkedWoId: data.linkedWoId || null,
      },
    });
  }

  async delete(id: string) {
    return this.prisma.expenseRecord.delete({ where: { id } });
  }
}
