import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service';
import { AuditService } from './audit/audit.service';
import { NotificationsService } from './notifications/notifications.service';
import { AssetsService } from './assets/assets.service';
import { InspectionsService } from './inspections/inspections.service';
import { PmService } from './pm/pm.service';
import { WorkordersService } from './workorders/workorders.service';

// Import Controllers
import { AuthModule } from './auth/auth.module';
import { AssetsController } from './assets/assets.controller';
import { InspectionsController } from './inspections/inspections.controller';
import { PmController } from './pm/pm.controller';
import { WorkordersController } from './workorders/workorders.controller';
import { RenewalsController } from './renewals/renewals.controller';
import { FuelController } from './fuel/fuel.controller';
import { DotController } from './dot/dot.controller';
import { VendorsController } from './vendors/vendors.controller';
import { TelematicsController } from './telematics/telematics.controller';
import { AccidentsController } from './accidents/accidents.controller';
import { AuditController as LogController } from './audit/audit.controller';
import { NotificationsController } from './notifications/notifications.controller';
import { ReportsController } from './reports/reports.controller';

@Module({
  imports: [AuthModule],
  controllers: [
    AppController,
    AssetsController,
    InspectionsController,
    PmController,
    WorkordersController,
    RenewalsController,
    FuelController,
    DotController,
    VendorsController,
    TelematicsController,
    AccidentsController,
    LogController,
    NotificationsController,
    ReportsController,
  ],
  providers: [
    AppService,
    PrismaService,
    AuditService,
    NotificationsService,
    AssetsService,
    InspectionsService,
    PmService,
    WorkordersService,
  ],
})
export class AppModule {}
