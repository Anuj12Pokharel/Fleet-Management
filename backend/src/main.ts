import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as path from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // Enable Cross-Origin Resource Sharing
  app.enableCors({
    origin: '*', // for development flexibility
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Global validation pipe with whitelist and transformation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidUnknownValues: false,
    }),
  );

  // Serve static files from the uploads directory
  app.useStaticAssets(path.join(__dirname, '..', 'uploads'), {
    prefix: '/uploads',
  });

  // ── Swagger / OpenAPI Documentation ──────────────────────────────────────
  const config = new DocumentBuilder()
    .setTitle('SuperTruck FleetCare API')
    .setDescription(
      `## SuperTruck FleetCare — Fleet Management & DOT Compliance Platform\n\n` +
      `Complete REST API for managing trucking fleets: assets, eDVIR inspections, ` +
      `preventive maintenance, work orders, fuel/IFTA, HOS logs, renewals, compliance, ` +
      `accident claims, telematics, and more.\n\n` +
      `### Authentication\n` +
      `All endpoints (except \`POST /api/auth/login\` and \`POST /api/auth/register\`) ` +
      `require a **Bearer JWT token**. Obtain a token via \`POST /api/auth/login\`, ` +
      `then click **Authorize** and enter: \`Bearer <your_token>\`.\n\n` +
      `### Roles\n` +
      `| Role | Access |\n` +
      `|------|--------|\n` +
      `| \`FLEET_MANAGER\` | Full access to all endpoints |\n` +
      `| \`MAINTENANCE_ADMIN\` | Full access except billing/reports |\n` +
      `| \`MECHANIC\` | Work orders, PM, assets, tires, parts |\n` +
      `| \`DRIVER\` | Inspections, HOS, assignments, fuel, emergency |\n\n` +
      `### Demo Credentials\n` +
      `| Email | Password | Role |\n` +
      `|-------|----------|------|\n` +
      `| manager@fleet.com | password123 | FLEET_MANAGER |\n` +
      `| admin@fleet.com | password123 | MAINTENANCE_ADMIN |\n` +
      `| mechanic@fleet.com | password123 | MECHANIC |\n` +
      `| driver@fleet.com | password123 | DRIVER |`
    )
    .setVersion('2.0.0')
    .setContact('SuperTruck FleetCare', 'https://fleet.supertruck.ai', 'support@supertruck.ai')
    .setLicense('Proprietary', 'https://fleet.supertruck.ai')
    .addServer('https://api.fleet.supertruck.ai', 'Production')
    .addServer('http://localhost:5000', 'Local Development')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', name: 'Authorization', in: 'header' },
      'JWT-Auth',
    )
    .addTag('Auth', 'User registration, login, and profile management')
    .addTag('Assets', 'Fleet vehicle and trailer management (TRACTOR / TRAILER)')
    .addTag('Inspections', 'eDVIR pre/post-trip inspection management')
    .addTag('PM', 'Preventive maintenance templates and schedules')
    .addTag('Work Orders', 'Service requests and work order lifecycle')
    .addTag('Renewals', 'FMCSA/DOT compliance renewals — 33 items across Driver, Equipment, Carrier')
    .addTag('Fuel & Tolls', 'Fuel card ingestion, IFTA reporting, toll transponder records')
    .addTag('Telematics', 'ELD odometer sync, DTC/J1939 fault codes, live GPS pings')
    .addTag('HOS', 'Hours of Service logs and 49 CFR 395 clock calculations')
    .addTag('Compliance', 'Full compliance dashboard — CDL, med certs, vehicle docs, state permits')
    .addTag('Accidents', 'Accident claims and insurance evidence management')
    .addTag('Assignments', 'Driver-to-vehicle assignment tracking')
    .addTag('Tires', 'Tire tread readings and alerts')
    .addTag('Brakes', 'Brake reading records')
    .addTag('Expenses', 'Operating expense records')
    .addTag('Safety', 'Safety scorecard metrics')
    .addTag('DOT', 'DOT roadside inspection records')
    .addTag('Vendors', 'Approved vendor / shop directory')
    .addTag('Contacts', 'Driver and contact directory')
    .addTag('Parts', 'Parts inventory management')
    .addTag('Places', 'Saved locations and geofences')
    .addTag('Documents', 'Fleet document storage')
    .addTag('Warranties', 'Asset warranty tracking')
    .addTag('Replacement', 'Asset TCO replacement analysis')
    .addTag('Reports', 'Fleet-wide analytics and KPI reports')
    .addTag('Audit', 'System audit log')
    .addTag('Notifications', 'Real-time push notifications and SSE feed')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
      tagsSorter: 'alpha',
      operationsSorter: 'method',
    },
    customSiteTitle: 'SuperTruck FleetCare API Docs',
    customfavIcon: 'https://fleet.supertruck.ai/favicon.ico',
    customCss: `
      .swagger-ui .topbar { background: #00BA7C; }
      .swagger-ui .topbar .download-url-wrapper { display: none; }
      .swagger-ui .info .title { color: #00BA7C; }
      .swagger-ui .btn.authorize { color: #00BA7C; border-color: #00BA7C; }
      .swagger-ui .btn.authorize svg { fill: #00BA7C; }
    `,
  });
  // ─────────────────────────────────────────────────────────────────────────

  const port = process.env.PORT || 5000;
  await app.listen(port, '0.0.0.0');
  console.log(`Application is running on: http://0.0.0.0:${port}`);
  console.log(`Swagger docs available at: http://0.0.0.0:${port}/api/docs`);
}
bootstrap();
