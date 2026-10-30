import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class PlacesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.place.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const place = await this.prisma.place.findUnique({ where: { id } });
    if (!place) throw new NotFoundException('Place not found');
    return place;
  }

  async create(data: {
    name: string;
    type: string;
    address: string;
    lat: number;
    lng: number;
    notes?: string;
  }) {
    return this.prisma.place.create({
      data: {
        name: data.name,
        type: data.type,
        address: data.address,
        lat: Number(data.lat),
        lng: Number(data.lng),
        notes: data.notes || null,
      },
    });
  }

  async update(id: string, data: any) {
    const updateData = { ...data };
    if (updateData.lat !== undefined) updateData.lat = Number(updateData.lat);
    if (updateData.lng !== undefined) updateData.lng = Number(updateData.lng);
    return this.prisma.place.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: string) {
    return this.prisma.place.delete({ where: { id } });
  }
}
