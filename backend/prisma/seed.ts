import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Create Users
  const passwordHash = bcrypt.hashSync('password123', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@fleet.com' },
    update: {},
    create: {
      email: 'admin@fleet.com',
      name: 'John Admin',
      passwordHash,
      role: 'MAINTENANCE_ADMIN',
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: 'manager@fleet.com' },
    update: {},
    create: {
      email: 'manager@fleet.com',
      name: 'Sarah Manager',
      passwordHash,
      role: 'FLEET_MANAGER',
    },
  });

  const mechanic = await prisma.user.upsert({
    where: { email: 'mechanic@fleet.com' },
    update: {},
    create: {
      email: 'mechanic@fleet.com',
      name: 'Dave Mechanic',
      passwordHash,
      role: 'MECHANIC',
    },
  });

  const driver = await prisma.user.upsert({
    where: { email: 'driver@fleet.com' },
    update: {},
    create: {
      email: 'driver@fleet.com',
      name: 'Bob Driver',
      passwordHash,
      role: 'DRIVER',
    },
  });

  console.log('Users created successfully.');

  // 2. Create Assets (Tractor + Trailer)
  const tractor1 = await prisma.asset.upsert({
    where: { vin: '1N4AL3AP0C123456' },
    update: {},
    create: {
      name: 'Tractor #101 (Peterbilt 579)',
      type: 'TRACTOR',
      vin: '1N4AL3AP0C123456',
      plateNumber: 'TX-TRK-101',
      status: 'OPERABLE',
      odometer: 145200.5,
      fuelType: 'Diesel',
    },
  });

  const trailer1 = await prisma.asset.upsert({
    where: { vin: '4H7A123456789012' },
    update: {},
    create: {
      name: 'Trailer #201 (Utility Dry Van)',
      type: 'TRAILER',
      vin: '4H7A123456789012',
      plateNumber: 'TX-TRL-201',
      status: 'OPERABLE',
      odometer: 89300.2,
      fuelType: 'None',
      parentAssetId: tractor1.id, // Linked to Tractor #101
    },
  });

  const tractor2 = await prisma.asset.upsert({
    where: { vin: '1N4AL3AP0D987654' },
    update: {},
    create: {
      name: 'Tractor #102 (Freightliner Cascadia)',
      type: 'TRACTOR',
      vin: '1N4AL3AP0D987654',
      plateNumber: 'TX-TRK-102',
      status: 'NEEDS_ATTENTION',
      odometer: 280100.8,
      fuelType: 'Diesel',
    },
  });

  const trailer2 = await prisma.asset.upsert({
    where: { vin: '4H7A987654321098' },
    update: {},
    create: {
      name: 'Trailer #202 (Great Dane Reefer)',
      type: 'TRAILER',
      vin: '4H7A987654321098',
      plateNumber: 'TX-TRL-202',
      status: 'OPERABLE',
      odometer: 120400.1,
      fuelType: 'Diesel', // Reefer trailers have a diesel unit
      parentAssetId: tractor2.id, // Linked to Tractor #102
    },
  });

  console.log('Assets created successfully.');

  // 3. Create Components for Tractor #101
  const componentsList = [
    { name: 'Engine', assetId: tractor1.id },
    { name: 'Fuel System', assetId: tractor1.id },
    { name: 'Electrical', assetId: tractor1.id },
    { name: 'Tyres', assetId: tractor1.id },
    { name: 'Axles', assetId: tractor1.id },
    // Trailer #201 components
    { name: 'Kingpin', assetId: trailer1.id },
    { name: 'Sliding Tandem', assetId: trailer1.id },
    { name: 'Door Seals', assetId: trailer1.id },
    { name: 'Tyres', assetId: trailer1.id },
  ];

  for (const component of componentsList) {
    await prisma.component.create({
      data: {
        name: component.name,
        assetId: component.assetId,
        status: 'OPERABLE',
        qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=component-${component.name.toLowerCase().replace(/ /g, '-')}-${component.assetId}`,
      },
    });
  }

  console.log('Components created successfully.');

  // 4. Create PM Templates
  const pmaTemplate = await prisma.pMTemplate.create({
    data: {
      name: 'PM-A Dry Service',
      description: 'Standard 10k mile check. Inspect fluid levels, brakes, lights, and grease chassis.',
      triggerMileage: 10000.0,
      triggerDays: 90,
      stepsJson: JSON.stringify(['Check engine oil level', 'Check coolants and fluids', 'Lubricate chassis fittings', 'Inspect brake linings', 'Inspect tyres pressure and tread depth']),
    },
  });

  const pmbTemplate = await prisma.pMTemplate.create({
    data: {
      name: 'PM-B Wet Service',
      description: 'Comprehensive 25k mile service. Engine oil change, replacement of oil/fuel filters, dyno analysis.',
      triggerMileage: 25000.0,
      triggerDays: 180,
      stepsJson: JSON.stringify(['Drain & replace engine oil', 'Replace oil filter', 'Replace primary/secondary fuel filters', 'Perform brake adjustments', 'Check transmission fluid', 'Conduct structural frame inspection']),
    },
  });

  const trailerPmTemplate = await prisma.pMTemplate.create({
    data: {
      name: 'Annual Trailer PM',
      description: 'Yearly structural, electrical and air system overhaul for trailers.',
      triggerMileage: 50000.0,
      triggerDays: 365,
      stepsJson: JSON.stringify(['Inspect kingpin wear', 'Lube sliding tandem rails', 'Inspect brake chambers and lines', 'Verify ABS sensor operations', 'Check door seals for water leaks']),
    },
  });

  console.log('PM Templates created successfully.');

  // 5. Link PM Schedules to Assets
  // Tractor 1 PM-A schedule
  await prisma.pMSchedule.create({
    data: {
      assetId: tractor1.id,
      templateId: pmaTemplate.id,
      lastServiceOdometer: 140000.0,
      lastServiceDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      nextDueOdometer: 150000.0,
      nextDueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // due in 60 days
      status: 'COMPLIANT',
    },
  });

  // Tractor 2 PM-A schedule (Needs attention / overdue)
  await prisma.pMSchedule.create({
    data: {
      assetId: tractor2.id,
      templateId: pmaTemplate.id,
      lastServiceOdometer: 268000.0,
      lastServiceDate: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000), // 100 days ago (expired on days: 90)
      nextDueOdometer: 278000.0, // odometer is 280100.8 (overdue on odometer)
      nextDueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // overdue by 10 days
      status: 'OVERDUE',
    },
  });

  console.log('PM Schedules created successfully.');

  // 6. Create Renewal Alerts (DOT Inspection, Insurance, IRP)
  // Tractor 1 - Active Insurance
  await prisma.renewalAlert.create({
    data: {
      assetId: tractor1.id,
      type: 'INSURANCE_POLICY',
      description: 'Commercial Auto Liability Coverage - Progressive Policy #99201',
      expiryDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days out
      status: 'ACTIVE',
    },
  });

  // Tractor 1 - Expiring DOT Annual (5 days out)
  await prisma.renewalAlert.create({
    data: {
      assetId: tractor1.id,
      type: 'DOT_ANNUAL_INSPECTION',
      description: 'Federal DOT Annual Inspection - Certificate #DOT-TX-9901',
      expiryDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days out
      status: 'ACTIVE',
    },
  });

  // Tractor 2 - Expired IRP Registration (Blocked)
  await prisma.renewalAlert.create({
    data: {
      assetId: tractor2.id,
      type: 'IRP_REGISTRATION',
      description: 'IRP Cab Card Registration - Account #IRP-88210',
      expiryDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // Expired 3 days ago
      status: 'EXPIRED',
    },
  });

  console.log('Renewal Alerts created successfully.');

  // 7. Create CRM Vendors
  const vendor1 = await prisma.vendor.create({
    data: {
      name: 'Dallas Truck & Engine Center',
      type: 'HEAVY_DUTY_SHOP',
      negotiatedRate: 145.0,
      contactInfo: 'dallas@truckcenter.com | (214) 555-0199',
      invoiceHistory: JSON.stringify([
        { invoiceNo: 'INV-1002', amount: 1250.00, date: '2026-05-12', details: 'EGR Valve replacement' }
      ]),
    },
  });

  const vendor2 = await prisma.vendor.create({
    data: {
      name: 'Love\'s Travel Stops #441',
      type: 'TYRE_SPECIALIST',
      negotiatedRate: 110.0,
      contactInfo: 'store441@loves.com | (972) 555-0322',
      invoiceHistory: JSON.stringify([
        { invoiceNo: 'INV-8899', amount: 620.00, date: '2026-04-18', details: 'Steer tyre replacement' }
      ]),
    },
  });

  console.log('Vendors created successfully.');

  console.log('Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
