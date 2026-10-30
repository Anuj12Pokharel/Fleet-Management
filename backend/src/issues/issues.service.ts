import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class IssuesService {
  constructor(private prisma: PrismaService) {}

  async findAll(assetId?: string) {
    if (assetId) {
      return this.prisma.issue.findMany({
        where: { assetId },
        orderBy: { createdAt: 'desc' },
      });
    }
    return this.prisma.issue.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const issue = await this.prisma.issue.findUnique({ where: { id } });
    if (!issue) throw new NotFoundException('Issue not found');
    return issue;
  }

  async create(data: {
    assetId: string;
    reportedBy: string;
    title: string;
    description: string;
    severity?: string;
    status?: string;
    linkedWoId?: string | null;
  }) {
    return this.prisma.issue.create({
      data: {
        assetId: data.assetId,
        reportedBy: data.reportedBy,
        title: data.title,
        description: data.description,
        severity: data.severity || 'MEDIUM',
        status: data.status || 'OPEN',
        linkedWoId: data.linkedWoId || null,
      },
    });
  }

  async update(id: string, data: any) {
    const updateData = { ...data };
    if (updateData.status === 'RESOLVED' && !updateData.resolvedAt) {
      updateData.resolvedAt = new Date();
    }
    return this.prisma.issue.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: string) {
    return this.prisma.issue.delete({ where: { id } });
  }
}
