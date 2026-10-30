import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Initializing database with core system users and templates...');

  // 1. Clean existing mock / transactional tables
  try {
    await prisma.workOrderPart.deleteMany();
    await prisma.purchaseOrder.deleteMany();
    await prisma.faultCode.deleteMany();
    await prisma.workOrder.deleteMany();
    await prisma.serviceRequest.deleteMany();
    await prisma.eDVIRInspection.deleteMany();
    await prisma.claimEvidence.deleteMany();
    await prisma.accidentClaim.deleteMany();
    await prisma.emergencyTicket.deleteMany();
    await prisma.fuelLog.deleteMany();
    await prisma.tollRecord.deleteMany();
    await prisma.dOTInspection.deleteMany();
    await prisma.renewalAlert.deleteMany();
    await prisma.pMSchedule.deleteMany();
    await prisma.hosLog.deleteMany();
    await prisma.expenseRecord.deleteMany();
    await prisma.issue.deleteMany();
    await prisma.warranty.deleteMany();
    await prisma.fleetDocument.deleteMany();
    await prisma.place.deleteMany();
    await prisma.contact.deleteMany();
    await prisma.vehicleAssignment.deleteMany();
    await prisma.tireReading.deleteMany();
    await prisma.replacementAnalysis.deleteMany();
    await prisma.part.deleteMany();
    await prisma.component.deleteMany();
    await prisma.vendor.deleteMany();
    await prisma.asset.deleteMany();
  } catch (err) {
    console.warn('Initial clean warning:', err);
  }

  // 2. Create Core Authenticated Users
  const passwordHash = bcrypt.hashSync('password123', 10);
  
  await prisma.user.upsert({
    where: { email: 'admin@fleet.com' },
    update: { passwordHash },
    create: {
      email: 'admin@fleet.com',
      name: 'John Admin',
      passwordHash,
      role: 'MAINTENANCE_ADMIN',
    },
  });

  await prisma.user.upsert({
    where: { email: 'manager@fleet.com' },
    update: { passwordHash },
    create: {
      email: 'manager@fleet.com',
      name: 'Sarah Manager',
      passwordHash,
      role: 'FLEET_MANAGER',
    },
  });

  await prisma.user.upsert({
    where: { email: 'mechanic@fleet.com' },
    update: { passwordHash },
    create: {
      email: 'mechanic@fleet.com',
      name: 'Dave Mechanic',
      passwordHash,
      role: 'MECHANIC',
    },
  });

  await prisma.user.upsert({
    where: { email: 'driver@fleet.com' },
    update: { passwordHash },
    create: {
      email: 'driver@fleet.com',
      name: 'Bob Driver',
      passwordHash,
      role: 'DRIVER',
    },
  });

  console.log('Core system users ready.');

  // 3. PM Standard Templates (standard reference catalog)
  await prisma.pMTemplate.upsert({
    where: { id: 'pmt-1' },
    update: {},
    create: {
      id: 'pmt-1',
      name: 'PM-A Service (Dry Lube & Inspection)',
      description: 'Oil & filter change, chassis lubrication, brake stroke check, tire pressure.',
      triggerMileage: 10000.0,
      triggerDays: 90,
      stepsJson: JSON.stringify(['Drain & fill engine oil (15W-40)', 'Replace oil filter & fuel filters', 'Grease kingpins and tie rods', 'Check tire tread and torque lugs']),
    },
  });

  await prisma.pMTemplate.upsert({
    where: { id: 'pmt-2' },
    update: {},
    create: {
      id: 'pmt-2',
      name: 'PM-B Comprehensive Service',
      description: 'Major drivetrain inspection, valve lash adjust, coolant flush, electrical audit.',
      triggerMileage: 25000.0,
      triggerDays: 180,
      stepsJson: JSON.stringify(['Complete PM-A tasks', 'Check transmission & differential fluids', 'Inspect DEF and DPF regeneration levels', 'Inspect air brake chambers and lines']),
    },
  });

  console.log('Database clean initialization complete. No mock entities or transactions.');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
