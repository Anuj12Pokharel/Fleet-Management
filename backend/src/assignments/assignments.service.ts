import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AssignmentsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.vehicleAssignment.findMany({
      orderBy: { startDate: 'desc' },
    });
  }

  async findOne(id: string) {
    const assignment = await this.prisma.vehicleAssignment.findUnique({ where: { id } });
    if (!assignment) throw new NotFoundException('Assignment not found');
    return assignment;
  }

  async create(data: {
    assetId: string;
    driverId: string;
    driverName: string;
    startDate?: string | Date;
    endDate?: string | Date | null;
    notes?: string;
    status?: string;
  }) {
    return this.prisma.vehicleAssignment.create({
      data: {
        assetId: data.assetId,
        driverId: data.driverId,
        driverName: data.driverName,
        startDate: data.startDate ? new Date(data.startDate) : new Date(),
        endDate: data.endDate ? new Date(data.endDate) : null,
        notes: data.notes,
        status: data.status || 'ACTIVE',
      },
    });
  }

  async update(id: string, data: any) {
    const updateData: any = { ...data };
    if (updateData.startDate) updateData.startDate = new Date(updateData.startDate);
    if (updateData.endDate) updateData.endDate = new Date(updateData.endDate);
    return this.prisma.vehicleAssignment.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: string) {
    return this.prisma.vehicleAssignment.delete({ where: { id } });
  }
}
