import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PMStatus } from '../enums';

@Injectable()
export class PmService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async findAllTemplates() {
    const list = await this.prisma.pMTemplate.findMany();
    return list.map(item => ({
      ...item,
      stepsJson: JSON.parse(item.stepsJson || '[]'),
    }));
  }

  async createTemplate(data: { name: string; description: string; triggerMileage: number; triggerDays: number; stepsJson: string[] }) {
    const template = await this.prisma.pMTemplate.create({
      data: {
        name: data.name,
        description: data.description,
        triggerMileage: data.triggerMileage,
        triggerDays: data.triggerDays,
        stepsJson: JSON.stringify(data.stepsJson),
      },
    });
    return {
      ...template,
      stepsJson: JSON.parse(template.stepsJson),
    };
  }

  async findAllSchedules() {
    const list = await this.prisma.pMSchedule.findMany({
      include: {
        asset: true,
        template: true,
      },
    });
    return list.map(item => ({
      ...item,
      template: item.template ? {
        ...item.template,
        stepsJson: JSON.parse(item.template.stepsJson || '[]'),
      } : null,
    }));
  }

  async createSchedule(data: { assetId: string; templateId: string; lastServiceOdometer: number; lastServiceDate: Date }) {
    const template = await this.prisma.pMTemplate.findUnique({
      where: { id: data.templateId },
    });
    if (!template) throw new NotFoundException('PM Template not found');

    const nextDueOdometer = data.lastServiceOdometer + template.triggerMileage;
    const nextDueDate = new Date(new Date(data.lastServiceDate).getTime() + template.triggerDays * 24 * 60 * 60 * 1000);

    const schedule = await this.prisma.pMSchedule.create({
      data: {
        assetId: data.assetId,
        templateId: data.templateId,
        lastServiceOdometer: data.lastServiceOdometer,
        lastServiceDate: new Date(data.lastServiceDate),
        nextDueOdometer,
        nextDueDate,
        status: 'COMPLIANT',
      },
      include: { asset: true, template: true },
    });

    await this.evaluateScheduleStatus(schedule.id, schedule.asset.odometer);
    const res = await this.prisma.pMSchedule.findUnique({
      where: { id: schedule.id },
      include: { asset: true, template: true },
    });
    if (res && res.template) {
      (res as any).template.stepsJson = JSON.parse(res.template.stepsJson || '[]');
    }
    return res;
  }

  async performPM(scheduleId: string, currentOdometer: number, userId?: string) {
    const schedule = await this.prisma.pMSchedule.findUnique({
      where: { id: scheduleId },
      include: { template: true, asset: true },
    });
    if (!schedule) throw new NotFoundException('PM Schedule not found');

    const nextDueOdometer = currentOdometer + schedule.template.triggerMileage;
    const nextDueDate = new Date(Date.now() + schedule.template.triggerDays * 24 * 60 * 60 * 1000);

    const updated = await this.prisma.pMSchedule.update({
      where: { id: scheduleId },
      data: {
        lastServiceOdometer: currentOdometer,
        lastServiceDate: new Date(),
        nextDueOdometer,
        nextDueDate,
        status: 'COMPLIANT',
      },
      include: { asset: true, template: true },
    });

    // Sync asset odometer as well
    if (currentOdometer > schedule.asset.odometer) {
      await this.prisma.asset.update({
        where: { id: schedule.assetId },
        data: { odometer: currentOdometer },
      });
    }

    if (updated && updated.template) {
      (updated as any).template.stepsJson = JSON.parse(updated.template.stepsJson || '[]');
    }
    return updated;
  }

  async evaluateScheduleStatus(scheduleId: string, assetOdometer: number) {
    const schedule = await this.prisma.pMSchedule.findUnique({
      where: { id: scheduleId },
      include: { template: true, asset: true },
    });
    if (!schedule) return;

    let newStatus = PMStatus.COMPLIANT;
    const mileageRemaining = schedule.nextDueOdometer - assetOdometer;
    const timeRemainingDays = (schedule.nextDueDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000);

    if (mileageRemaining <= 0 || timeRemainingDays <= 0) {
      newStatus = PMStatus.OVERDUE;
    } else if (mileageRemaining <= 1000 || timeRemainingDays <= 15) {
      newStatus = PMStatus.DUE;
    }

    if (newStatus !== schedule.status) {
      await this.prisma.pMSchedule.update({
        where: { id: scheduleId },
        data: { status: newStatus },
      });

      if (newStatus === PMStatus.OVERDUE || newStatus === PMStatus.DUE) {
        this.notificationsService.emit({
          type: 'PM_ALERT',
          title: `PM Service Alert: ${schedule.asset.name}`,
          message: `${schedule.template.name} is ${newStatus}. Next due: ${schedule.nextDueOdometer.toFixed(0)} miles / ${schedule.nextDueDate.toLocaleDateString()}`,
          assetId: schedule.assetId,
          timestamp: new Date().toISOString(),
        });
      }
    }
  }

  async syncAllAssetPMs(assetId: string, currentOdometer: number) {
    const schedules = await this.prisma.pMSchedule.findMany({
      where: { assetId },
    });
    for (const schedule of schedules) {
      await this.evaluateScheduleStatus(schedule.id, currentOdometer);
    }
  }
}
