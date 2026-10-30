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
import { RenewalsService } from './renewals/renewals.service';
import { ZitadelRenewalAuthGuard } from './renewals/zitadel-renewal-auth.guard';

// Modules
import { AuthModule } from './auth/auth.module';
import { PartsModule } from './parts/parts.module';
import { AssignmentsModule } from './assignments/assignments.module';
import { TiresModule } from './tires/tires.module';
import { BrakesModule } from './brakes/brakes.module';
import { ExpensesModule } from './expenses/expenses.module';
import { IssuesModule } from './issues/issues.module';
import { ContactsModule } from './contacts/contacts.module';
import { PlacesModule } from './places/places.module';
import { DocumentsModule } from './documents/documents.module';
import { WarrantiesModule } from './warranties/warranties.module';
import { ReplacementModule } from './replacement/replacement.module';

// Controllers
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
import { HosController } from './hos/hos.controller';
import { SafetyController } from './safety/safety.controller';
import { RelayFuelService } from './fuel/relay-fuel.service';
import { ComplianceController } from './compliance/compliance.controller';

@Module({
  imports: [
    AuthModule,
    PartsModule,
    AssignmentsModule,
    TiresModule,
    BrakesModule,
    ExpensesModule,
    IssuesModule,
    ContactsModule,
    PlacesModule,
    DocumentsModule,
    WarrantiesModule,
    ReplacementModule,
  ],
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
    HosController,
    SafetyController,
    ComplianceController,
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
    RenewalsService,
    ZitadelRenewalAuthGuard,
    RelayFuelService,
  ],
})
export class AppModule {}
