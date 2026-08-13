export interface User {
  id: string;
  email: string;
  name: string;
  role: 'DRIVER' | 'MECHANIC' | 'MAINTENANCE_ADMIN' | 'FLEET_MANAGER';
}

export interface Asset {
  id: string;
  type: 'TRACTOR' | 'TRAILER';
  name: string;
  vin: string;
  plateNumber: string;
  status: 'OPERABLE' | 'NEEDS_ATTENTION' | 'INOPERABLE';
  odometer: number;
  fuelType: string;
  qrCodeUrl: string;
  parentAssetId?: string | null;
}

export interface Component {
  id: string;
  assetId: string;
  name: string;
  status: 'OPERABLE' | 'NEEDS_ATTENTION' | 'INOPERABLE';
  lastServiceDate?: string | null;
  qrCodeUrl: string;
}

export interface EDVIRInspection {
  id: string;
  assetId: string;
  driverName: string;
  status: 'PASSED' | 'FAILED';
  odometer: number;
  checklistJson: Record<string, string>;
  notes?: string;
  createdAt: string;
}

export interface PMTemplate {
  id: string;
  name: string;
  description: string;
  triggerMileage: number;
  triggerDays: number;
  stepsJson: string[];
}

export interface PMSchedule {
  id: string;
  assetId: string;
  templateId: string;
  lastServiceOdometer: number;
  lastServiceDate: string;
  nextDueOdometer: number;
  nextDueDate: string;
  status: 'COMPLIANT' | 'DUE' | 'OVERDUE';
}

export interface ServiceRequest {
  id: string;
  assetId: string;
  driverName: string;
  description: string;
  mediaUrls: string[];
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

export interface WorkOrder {
  id: string;
  serviceRequestId?: string | null;
  assetId: string;
  componentId?: string | null;
  assignedMechanicId?: string | null;
  type: 'INTERNAL' | 'EXTERNAL';
  vendorId?: string | null;
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY';
  description: string;
  laborCost: number;
  partsCost: number;
  totalCost: number;
  dotViolationId?: string | null;
  completedAt?: string | null;
  createdAt: string;
}

export interface PurchaseOrder {
  id: string;
  workOrderId: string;
  vendorId: string;
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'PAID';
  createdAt: string;
}

export interface RenewalAlert {
  id: string;
  assetId: string;
  type: 'DOT_ANNUAL_INSPECTION' | 'IRP_REGISTRATION' | 'INSURANCE_POLICY';
  description: string;
  expiryDate: string;
  status: 'ACTIVE' | 'DISMISSED' | 'EXPIRED';
}

export interface FuelLog {
  id: string;
  assetId: string;
  cardTransactionId: string;
  gallons: number;
  cost: number;
  location: string;
  odometer: number;
  mpg: number;
  isAnomaly: boolean;
  createdAt: string;
}

export interface TollRecord {
  id: string;
  assetId: string;
  transponderId: string;
  amount: number;
  location: string;
  timestamp: string;
}

export interface DOTInspection {
  id: string;
  assetId: string;
  inspectionDate: string;
  result: 'CLEAN' | 'VIOLATION';
  violationsJson: string[];
  createdAt: string;
}

export interface Vendor {
  id: string;
  name: string;
  type: 'HEAVY_DUTY_SHOP' | 'TYRE_SPECIALIST' | 'MOBILE_ROADSIDE_SERVICE' | 'INDEPENDENT_MECHANIC' | 'DOT_INSPECTOR';
  negotiatedRate: number;
  contactInfo: string;
  invoiceHistory: Array<{ invoiceNo: string; amount: number; date: string; details: string }>;
}

export interface EmergencyTicket {
  id: string;
  assetId: string;
  reporterName: string;
  description: string;
  gpsLatitude: number;
  gpsLongitude: number;
  status: 'OPEN' | 'DISPATCHED' | 'COMPLETED';
  assignedVendorId?: string | null;
  mechanicEta?: string | null;
  downtimeHours: number;
  createdAt: string;
}

export interface FaultCode {
  id: string;
  assetId: string;
  source: string;
  code: string;
  description: string;
  status: 'ACTIVE' | 'RESOLVED';
  workOrderId?: string | null;
  createdAt: string;
}

export interface AccidentClaim {
  id: string;
  assetId: string;
  driverName: string;
  policeReportNumber: string;
  statement: string;
  thirdPartyDetails: string;
  insurancePayout: number;
  actualRepairCost: number;
  status: 'OPEN' | 'SETTLED';
  claimDate: string;
}

export interface AuditLog {
  id: string;
  userName: string;
  action: string;
  entityName: string;
  entityId: string;
  timestamp: string;
}

export interface SystemNotification {
  id: string;
  type: 'WORK_ORDER' | 'PM_ALERT' | 'BREAKDOWN' | 'COMPLIANCE';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

// ── NEW Fleetio-parity interfaces ──────────────────────────────────────────

export interface VehicleAssignment {
  id: string;
  assetId: string;
  driverId: string;
  driverName: string;
  startDate: string;
  endDate?: string | null;
  notes?: string;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
}

export interface TireReading {
  id: string;
  assetId: string;
  axlePosition: 'STEER_LEFT' | 'STEER_RIGHT' | 'DRIVE1_LEFT' | 'DRIVE1_RIGHT' | 'DRIVE2_LEFT' | 'DRIVE2_RIGHT' | 'TRAILER_LEFT' | 'TRAILER_RIGHT';
  tireBrand: string;
  psi: number;
  treadDepth: number; // in 32nds of an inch
  recordedAt: string;
  recordedBy: string;
}

export interface ExpenseRecord {
  id: string;
  assetId: string;
  category: 'FUEL' | 'LABOR' | 'PARTS' | 'TOLLS' | 'INSURANCE' | 'REGISTRATION' | 'TIRES' | 'OTHER';
  amount: number;
  description: string;
  date: string;
  linkedWoId?: string | null;
}

export interface ReplacementAnalysis {
  id: string;
  assetId: string;
  purchasePrice: number;
  purchaseDate: string;
  lifetimeCostToDate: number;
  estimatedCurrentValue: number;
  recommendation: 'KEEP' | 'MONITOR' | 'REPLACE';
}

export interface Issue {
  id: string;
  assetId: string;
  reportedBy: string;
  title: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED';
  createdAt: string;
  resolvedAt?: string | null;
  linkedWoId?: string | null;
}

export interface Contact {
  id: string;
  userId?: string | null;
  name: string;
  role: 'DRIVER' | 'MECHANIC' | 'MAINTENANCE_ADMIN' | 'FLEET_MANAGER' | 'EXTERNAL_VENDOR' | 'DOT_INSPECTOR';
  phone: string;
  email: string;
  cdlNumber?: string | null;
  cdlExpiry?: string | null;
  medCardExpiry?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  avatarInitials: string;
}

export interface Part {
  id: string;
  partNumber: string;
  name: string;
  category: 'ENGINE' | 'BRAKES' | 'ELECTRICAL' | 'FILTERS' | 'TIRES' | 'FLUIDS' | 'BODY' | 'HVAC' | 'OTHER';
  stockQty: number;
  reorderLevel: number;
  unitCost: number;
  location: string;
  compatibleAssets: string[];
}

export interface Place {
  id: string;
  name: string;
  type: 'DEPOT' | 'CUSTOMER_SITE' | 'FUEL_STOP' | 'REPAIR_SHOP' | 'DOT_STATION' | 'OTHER';
  address: string;
  lat: number;
  lng: number;
  notes?: string;
}

export interface FleetDocument {
  id: string;
  assetId: string;
  name: string;
  type: 'INSURANCE_CARD' | 'REGISTRATION' | 'INSPECTION_CERT' | 'CDL_SCAN' | 'ACCIDENT_REPORT' | 'WARRANTY_CERT' | 'OTHER';
  fileUrl: string;
  uploadedBy: string;
  uploadedAt: string;
  expiresAt?: string | null;
}

export interface Warranty {
  id: string;
  assetId: string;
  componentName: string;
  provider: string;
  warrantyNumber: string;
  startDate: string;
  expiryDate: string;
  coverageDetails: string;
  status: 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'CLAIMED';
}

// Initial Mock Data

export const initialUsers: User[] = [
  { id: 'u1', email: 'admin@fleet.com', name: 'John Admin', role: 'MAINTENANCE_ADMIN' },
  { id: 'u2', email: 'manager@fleet.com', name: 'Sarah Manager', role: 'FLEET_MANAGER' },
  { id: 'u3', email: 'mechanic@fleet.com', name: 'Dave Mechanic', role: 'MECHANIC' },
  { id: 'u4', email: 'driver@fleet.com', name: 'Bob Driver', role: 'DRIVER' }
];

export const initialAssets: Asset[] = [
  { id: 'a1', type: 'TRACTOR', name: 'Tractor #101 (Peterbilt 579)', vin: '1N4AL3AP0C123456', plateNumber: 'TX-TRK-101', status: 'OPERABLE', odometer: 145200.5, fuelType: 'Diesel', qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=asset-1N4AL3AP0C123456' },
  { id: 'a2', type: 'TRAILER', name: 'Trailer #201 (Utility Dry Van)', vin: '4H7A123456789012', plateNumber: 'TX-TRL-201', status: 'OPERABLE', odometer: 89300.2, fuelType: 'None', qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=asset-4H7A123456789012', parentAssetId: 'a1' },
  { id: 'a3', type: 'TRACTOR', name: 'Tractor #102 (Freightliner Cascadia)', vin: '1N4AL3AP0D987654', plateNumber: 'TX-TRK-102', status: 'NEEDS_ATTENTION', odometer: 280100.8, fuelType: 'Diesel', qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=asset-1N4AL3AP0D987654' },
  { id: 'a4', type: 'TRAILER', name: 'Trailer #202 (Great Dane Reefer)', vin: '4H7A987654321098', plateNumber: 'TX-TRL-202', status: 'OPERABLE', odometer: 120400.1, fuelType: 'Diesel', qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=asset-4H7A987654321098', parentAssetId: 'a3' }
];

const initialComponents: Component[] = [
  { id: 'c1', assetId: 'a1', name: 'Engine', status: 'OPERABLE', qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=component-engine-a1' },
  { id: 'c2', assetId: 'a1', name: 'Fuel System', status: 'OPERABLE', qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=component-fuel-system-a1' },
  { id: 'c3', assetId: 'a1', name: 'Electrical', status: 'OPERABLE', qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=component-electrical-a1' },
  { id: 'c4', assetId: 'a1', name: 'Tyres', status: 'OPERABLE', qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=component-tyres-a1' },
  { id: 'c5', assetId: 'a2', name: 'Kingpin', status: 'OPERABLE', qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=component-kingpin-a2' },
  { id: 'c6', assetId: 'a2', name: 'Sliding Tandem', status: 'OPERABLE', qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=component-sliding-tandem-a2' },
  { id: 'c7', assetId: 'a2', name: 'Door Seals', status: 'OPERABLE', qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=component-door-seals-a2' }
];

const initialPMTemplates: PMTemplate[] = [
  { id: 't1', name: 'PM-A Dry Service', description: 'Standard 10k mile check. Inspect fluid levels, brakes, lights, and grease chassis.', triggerMileage: 10000, triggerDays: 90, stepsJson: ['Check engine oil level', 'Check coolants and fluids', 'Lubricate chassis fittings', 'Inspect brake linings', 'Inspect tyres pressure'] },
  { id: 't2', name: 'PM-B Wet Service', description: 'Comprehensive 25k mile service. Engine oil change, replacement of filters, chassis lubrication.', triggerMileage: 25000, triggerDays: 180, stepsJson: ['Drain & replace engine oil', 'Replace oil filter', 'Replace primary/secondary fuel filters', 'Perform brake adjustments', 'Check transmission fluid'] },
  { id: 't3', name: 'Annual Trailer PM', description: 'Yearly structural, electrical and air system inspection for trailers.', triggerMileage: 50000, triggerDays: 365, stepsJson: ['Inspect kingpin wear', 'Lube sliding tandem rails', 'Inspect brake chambers', 'Verify ABS sensor operations'] }
];

const initialPMSchedules: PMSchedule[] = [
  { id: 'ps1', assetId: 'a1', templateId: 't1', lastServiceOdometer: 140000.0, lastServiceDate: '2026-05-15', nextDueOdometer: 150000.0, nextDueDate: '2026-08-15', status: 'COMPLIANT' },
  { id: 'ps2', assetId: 'a3', templateId: 't1', lastServiceOdometer: 268000.0, lastServiceDate: '2026-03-01', nextDueOdometer: 278000.0, nextDueDate: '2026-06-01', status: 'OVERDUE' }
];

const initialRenewalAlerts: RenewalAlert[] = [
  { id: 'r1', assetId: 'a1', type: 'INSURANCE_POLICY', description: 'Commercial Liability - Progressive Policy #99201', expiryDate: '2026-08-01', status: 'ACTIVE' },
  { id: 'r2', assetId: 'a1', type: 'DOT_ANNUAL_INSPECTION', description: 'Federal DOT Annual Inspection - Certificate #DOT-TX-9901', expiryDate: '2026-06-20', status: 'ACTIVE' }, // 4 days left
  { id: 'r3', assetId: 'a3', type: 'IRP_REGISTRATION', description: 'IRP Cab Card Registration - Account #IRP-88210', expiryDate: '2026-06-12', status: 'EXPIRED' } // Blocked dispatch
];

const initialVendors: Vendor[] = [
  { id: 'v1', name: 'Dallas Truck & Engine Center', type: 'HEAVY_DUTY_SHOP', negotiatedRate: 145.0, contactInfo: 'dallas@truckcenter.com | (214) 555-0199', invoiceHistory: [{ invoiceNo: 'INV-1002', amount: 1250.00, date: '2026-05-12', details: 'EGR Valve replacement' }] },
  { id: 'v2', name: 'Love\'s Travel Stops #441', type: 'TYRE_SPECIALIST', negotiatedRate: 110.0, contactInfo: 'store441@loves.com | (972) 555-0322', invoiceHistory: [{ invoiceNo: 'INV-8899', amount: 620.00, date: '2026-04-18', details: 'Steer tyre replacement' }] },
  { id: 'v3', name: 'Roadside Repair Inc', type: 'MOBILE_ROADSIDE_SERVICE', negotiatedRate: 165.0, contactInfo: 'roadside@repair.com | (800) 555-0100', invoiceHistory: [] }
];

export const initialFuelLogs: FuelLog[] = [
  { id: 'f1', assetId: 'a1', cardTransactionId: 'TX-FUEL-9901', gallons: 120, cost: 420.00, location: 'TX', odometer: 144500, mpg: 6.1, isAnomaly: false, createdAt: '2026-06-10T14:30:00Z' },
  { id: 'f2', assetId: 'a1', cardTransactionId: 'TX-FUEL-9950', gallons: 115, cost: 405.00, location: 'TX', odometer: 145200, mpg: 6.09, isAnomaly: false, createdAt: '2026-06-15T09:15:00Z' },
  { id: 'f3', assetId: 'a3', cardTransactionId: 'NV-FUEL-1001', gallons: 150, cost: 580.00, location: 'NV', odometer: 280100, mpg: 2.1, isAnomaly: true, createdAt: '2026-06-14T18:45:00Z' } // Anomaly drop
];

export const initialTollRecords: TollRecord[] = [
  { id: 'tl1', assetId: 'a1', transponderId: 'TX-PASS-881', amount: 12.50, location: 'DFW Turnpike Toll Plaza', timestamp: '2026-06-12T08:12:00Z' },
  { id: 'tl2', assetId: 'a3', transponderId: 'TX-PASS-902', amount: 24.00, location: 'Houston Grand Parkway', timestamp: '2026-06-14T11:40:00Z' }
];

const initialDOTInspections: DOTInspection[] = [
  { id: 'd1', assetId: 'a1', inspectionDate: '2026-05-10', result: 'CLEAN', violationsJson: [], createdAt: '2026-05-10T10:00:00Z' },
  { id: 'd2', assetId: 'a3', inspectionDate: '2026-06-05', result: 'VIOLATION', violationsJson: ['Out-of-adjustment brake chamber', 'Leaking wheel seal'], createdAt: '2026-06-05T14:22:00Z' }
];

const initialWorkOrders: WorkOrder[] = [
  { id: 'wo1', assetId: 'a3', priority: 'HIGH', type: 'INTERNAL', status: 'OPEN', description: 'DOT Violation: Out-of-adjustment brake chamber and leaking wheel seal.', laborCost: 0, partsCost: 0, totalCost: 0, dotViolationId: 'd2', createdAt: '2026-06-05T14:30:00Z' }
];

const initialEmergencyTickets: EmergencyTicket[] = [
  { id: 'e1', assetId: 'a3', reporterName: 'Bob Driver', description: 'Tractor cooling engine warning light on, steam from radiator.', gpsLatitude: 32.7767, gpsLongitude: -96.7970, status: 'DISPATCHED', assignedVendorId: 'v3', mechanicEta: '2026-06-16T14:45:00Z', downtimeHours: 1.5, createdAt: '2026-06-16T13:00:00Z' }
];

const initialFaultCodes: FaultCode[] = [
  { id: 'fc1', assetId: 'a3', source: 'Motive', code: 'SPN 110 FMI 15', description: 'Engine Coolant Temperature High', status: 'ACTIVE', workOrderId: 'wo1', createdAt: '2026-06-16T12:55:00Z' }
];

const initialAuditLogs: AuditLog[] = [
  { id: 'au1', userName: 'System', action: 'CREATE', entityName: 'Asset', entityId: 'a1', timestamp: '2026-06-16T07:21:43Z' }
];

const initialNotifications: SystemNotification[] = [
  { id: 'n1', type: 'COMPLIANCE', title: 'IRP Cab Card Expired', message: 'Tractor #102 is blocked from active dispatches.', timestamp: '2026-06-12T00:00:00Z', read: false },
  { id: 'n2', type: 'PM_ALERT', title: 'PM Service Overdue', message: 'Tractor #102 PM-A Dry Service is overdue.', timestamp: '2026-06-01T08:00:00Z', read: false },
  { id: 'n3', type: 'BREAKDOWN', title: 'Breakdown Reported', message: 'Tractor #102 cooling engine failure.', timestamp: '2026-06-16T13:00:00Z', read: false }
];

const initialAccidentClaims: AccidentClaim[] = [
  {
    id: 'claim-1',
    assetId: 'a3',
    driverName: 'Bob Driver',
    policeReportNumber: 'PR-2026-8812',
    statement: 'Collision on highway I-35. Tractor #102 sustained front-end damage after third-party cut in front.',
    thirdPartyDetails: 'State Farm Insurance, Policy #SF-88210, Driver: Jane Doe',
    insurancePayout: 4500,
    actualRepairCost: 5200,
    status: 'OPEN',
    claimDate: '2026-06-14'
  }
];

export const initialAssignments: VehicleAssignment[] = [
  { id: 'va1', assetId: 'a1', driverId: 'u4', driverName: 'Bob Driver', startDate: '2026-06-10', endDate: null, notes: 'Dallas to Houston route', status: 'ACTIVE' },
  { id: 'va2', assetId: 'a3', driverId: 'u4', driverName: 'Bob Driver', startDate: '2026-05-01', endDate: '2026-05-31', notes: 'West coast relay', status: 'COMPLETED' }
];

export const initialTireReadings: TireReading[] = [
  { id: 'tr1', assetId: 'a1', axlePosition: 'STEER_LEFT', tireBrand: 'Michelin XZA', psi: 110, treadDepth: 10, recordedAt: '2026-06-10T09:00:00Z', recordedBy: 'Dave Mechanic' },
  { id: 'tr2', assetId: 'a1', axlePosition: 'STEER_RIGHT', tireBrand: 'Michelin XZA', psi: 108, treadDepth: 9, recordedAt: '2026-06-10T09:00:00Z', recordedBy: 'Dave Mechanic' },
  { id: 'tr3', assetId: 'a1', axlePosition: 'DRIVE1_LEFT', tireBrand: 'Bridgestone R283', psi: 100, treadDepth: 6, recordedAt: '2026-06-10T09:00:00Z', recordedBy: 'Dave Mechanic' },
  { id: 'tr4', assetId: 'a1', axlePosition: 'DRIVE1_RIGHT', tireBrand: 'Bridgestone R283', psi: 98, treadDepth: 5, recordedAt: '2026-06-10T09:00:00Z', recordedBy: 'Dave Mechanic' },
  { id: 'tr5', assetId: 'a3', axlePosition: 'STEER_LEFT', tireBrand: 'Goodyear G661', psi: 85, treadDepth: 3, recordedAt: '2026-06-12T14:00:00Z', recordedBy: 'Dave Mechanic' },
  { id: 'tr6', assetId: 'a3', axlePosition: 'STEER_RIGHT', tireBrand: 'Goodyear G661', psi: 82, treadDepth: 2, recordedAt: '2026-06-12T14:00:00Z', recordedBy: 'Dave Mechanic' }
];

export const initialExpenseRecords: ExpenseRecord[] = [
  { id: 'ex1', assetId: 'a1', category: 'FUEL', amount: 420.00, description: 'WEX fuel card fill-up TX', date: '2026-06-10', linkedWoId: null },
  { id: 'ex2', assetId: 'a1', category: 'FUEL', amount: 405.00, description: 'WEX fuel card fill-up TX', date: '2026-06-15', linkedWoId: null },
  { id: 'ex3', assetId: 'a1', category: 'LABOR', amount: 580.00, description: 'EGR valve service labor', date: '2026-05-12', linkedWoId: 'wo-1' },
  { id: 'ex4', assetId: 'a1', category: 'TOLLS', amount: 12.50, description: 'DFW Turnpike', date: '2026-06-12', linkedWoId: null },
  { id: 'ex5', assetId: 'a1', category: 'INSURANCE', amount: 1200.00, description: 'Progressive monthly premium', date: '2026-06-01', linkedWoId: null },
  { id: 'ex6', assetId: 'a3', category: 'FUEL', amount: 580.00, description: 'WEX fuel card NV', date: '2026-06-14', linkedWoId: null },
  { id: 'ex7', assetId: 'a3', category: 'PARTS', amount: 340.00, description: 'Brake chamber replacement parts', date: '2026-06-05', linkedWoId: null },
  { id: 'ex8', assetId: 'a3', category: 'REGISTRATION', amount: 850.00, description: 'IRP Cab Card annual renewal', date: '2026-01-15', linkedWoId: null }
];

export const initialReplacementAnalysis: ReplacementAnalysis[] = [
  { id: 'ra1', assetId: 'a1', purchasePrice: 148000, purchaseDate: '2021-03-15', lifetimeCostToDate: 42500, estimatedCurrentValue: 95000, recommendation: 'KEEP' },
  { id: 'ra2', assetId: 'a3', purchasePrice: 135000, purchaseDate: '2018-07-20', lifetimeCostToDate: 98200, estimatedCurrentValue: 42000, recommendation: 'MONITOR' },
  { id: 'ra3', assetId: 'a2', purchasePrice: 42000, purchaseDate: '2020-01-10', lifetimeCostToDate: 12400, estimatedCurrentValue: 28000, recommendation: 'KEEP' },
  { id: 'ra4', assetId: 'a4', purchasePrice: 55000, purchaseDate: '2016-09-05', lifetimeCostToDate: 67800, estimatedCurrentValue: 18000, recommendation: 'REPLACE' }
];

export const initialIssues: Issue[] = [
  { id: 'iss1', assetId: 'a1', reportedBy: 'Bob Driver', title: 'AC Unit Blowing Warm Air', description: 'Cab AC not cooling. Compressor seems weak.', severity: 'MEDIUM', status: 'OPEN', createdAt: '2026-06-14T08:00:00Z', resolvedAt: null, linkedWoId: null },
  { id: 'iss2', assetId: 'a3', reportedBy: 'Bob Driver', title: 'Check Engine Light On', description: 'CEL appeared after restart at truck stop. No power loss noticed yet.', severity: 'HIGH', status: 'INVESTIGATING', createdAt: '2026-06-12T11:30:00Z', resolvedAt: null, linkedWoId: null },
  { id: 'iss3', assetId: 'a2', reportedBy: 'Dave Mechanic', title: 'Rear Door Seal Cracked', description: 'Top right door seal is cracked. Risk of load moisture exposure.', severity: 'LOW', status: 'RESOLVED', createdAt: '2026-06-08T14:00:00Z', resolvedAt: '2026-06-10T09:00:00Z', linkedWoId: null }
];

export const initialContacts: Contact[] = [
  { id: 'con1', userId: 'u4', name: 'Bob Driver', role: 'DRIVER', phone: '(214) 555-0181', email: 'driver@fleet.com', cdlNumber: 'TX-CDL-882910', cdlExpiry: '2026-09-01', medCardExpiry: '2026-08-15', emergencyContactName: 'Mary Driver', emergencyContactPhone: '(214) 555-0192', avatarInitials: 'BD' },
  { id: 'con2', userId: 'u3', name: 'Dave Mechanic', role: 'MECHANIC', phone: '(972) 555-0210', email: 'mechanic@fleet.com', cdlNumber: null, cdlExpiry: null, medCardExpiry: null, emergencyContactName: 'Sue Mechanic', emergencyContactPhone: '(972) 555-0211', avatarInitials: 'DM' },
  { id: 'con3', userId: 'u1', name: 'John Admin', role: 'MAINTENANCE_ADMIN', phone: '(817) 555-0330', email: 'admin@fleet.com', cdlNumber: null, cdlExpiry: null, medCardExpiry: null, emergencyContactName: null, emergencyContactPhone: null, avatarInitials: 'JA' },
  { id: 'con4', userId: 'u2', name: 'Sarah Manager', role: 'FLEET_MANAGER', phone: '(214) 555-0404', email: 'manager@fleet.com', cdlNumber: null, cdlExpiry: null, medCardExpiry: null, emergencyContactName: null, emergencyContactPhone: null, avatarInitials: 'SM' },
  { id: 'con5', userId: null, name: 'Carlos Reyes', role: 'DRIVER', phone: '(713) 555-0556', email: 'creyes@fleet.com', cdlNumber: 'TX-CDL-771200', cdlExpiry: '2027-02-28', medCardExpiry: '2026-12-01', emergencyContactName: 'Ana Reyes', emergencyContactPhone: '(713) 555-0557', avatarInitials: 'CR' }
];

export const initialParts: Part[] = [
  { id: 'p1', partNumber: 'AIR-FILT-001', name: 'Engine Air Filter - Peterbilt 579', category: 'FILTERS', stockQty: 4, reorderLevel: 2, unitCost: 45.00, location: 'Shelf A-1', compatibleAssets: ['a1'] },
  { id: 'p2', partNumber: 'OIL-FILT-002', name: 'Engine Oil Filter - Heavy Duty', category: 'FILTERS', stockQty: 8, reorderLevel: 3, unitCost: 28.50, location: 'Shelf A-2', compatibleAssets: ['a1', 'a3'] },
  { id: 'p3', partNumber: 'BRK-PAD-010', name: 'Brake Lining Set - Steer Axle', category: 'BRAKES', stockQty: 2, reorderLevel: 2, unitCost: 185.00, location: 'Shelf B-3', compatibleAssets: ['a1', 'a3'] },
  { id: 'p4', partNumber: 'FUEL-FILT-005', name: 'Primary Fuel Filter', category: 'FILTERS', stockQty: 6, reorderLevel: 3, unitCost: 35.00, location: 'Shelf A-3', compatibleAssets: ['a1', 'a3'] },
  { id: 'p5', partNumber: 'ENG-BELT-020', name: 'Serpentine Belt - Cummins X15', category: 'ENGINE', stockQty: 1, reorderLevel: 2, unitCost: 220.00, location: 'Shelf C-1', compatibleAssets: ['a1'] },
  { id: 'p6', partNumber: 'COOL-FLUID-001', name: 'Extended Life Coolant - 1 Gal', category: 'FLUIDS', stockQty: 12, reorderLevel: 4, unitCost: 18.00, location: 'Fluid Bay', compatibleAssets: ['a1', 'a3'] },
  { id: 'p7', partNumber: 'TIR-STEER-080', name: 'Steer Tire 295/75R22.5 - Michelin', category: 'TIRES', stockQty: 0, reorderLevel: 2, unitCost: 520.00, location: 'Tire Bay', compatibleAssets: ['a1', 'a3'] },
  { id: 'p8', partNumber: 'ELEC-FUSE-BOX', name: 'Main Fuse Box Assembly', category: 'ELECTRICAL', stockQty: 1, reorderLevel: 1, unitCost: 340.00, location: 'Shelf D-2', compatibleAssets: ['a3'] }
];

export const initialPlaces: Place[] = [
  { id: 'pl1', name: 'Dallas Main Depot', type: 'DEPOT', address: '1200 Logistics Blvd, Dallas TX 75201', lat: 32.7767, lng: -96.7970, notes: 'Main fleet yard. 24/7 security.' },
  { id: 'pl2', name: 'Houston Terminal', type: 'DEPOT', address: '4500 Port Access Rd, Houston TX 77001', lat: 29.7604, lng: -95.3698, notes: 'Secondary yard. Contact: Mike (713) 555-0100' },
  { id: 'pl3', name: 'Love\'s Travel Stop #441', type: 'FUEL_STOP', address: '9100 I-20 Service Rd, Abilene TX 79601', lat: 32.4487, lng: -99.7331, notes: 'Preferred diesel stop. DEF available.' },
  { id: 'pl4', name: 'Dallas Truck & Engine Center', type: 'REPAIR_SHOP', address: '7800 Industrial Pkwy, Dallas TX 75237', lat: 32.6881, lng: -96.8960, notes: 'Primary vendor. Rate: $145/hr.' },
  { id: 'pl5', name: 'TX DOT Inspection Station I-35', type: 'DOT_STATION', address: 'I-35 Northbound, Gainesville TX 76240', lat: 33.6357, lng: -97.1336, notes: 'Fixed scale. Weigh 80k lbs limit.' },
  { id: 'pl6', name: 'Amazon DSP - Coppell FC', type: 'CUSTOMER_SITE', address: '1200 Champion Dr, Coppell TX 75019', lat: 32.9546, lng: -97.0139, notes: 'Drop & hook. No wait time usually.' }
];

export const initialDocuments: FleetDocument[] = [
  { id: 'doc1', assetId: 'a1', name: 'Progressive Insurance Card 2026', type: 'INSURANCE_CARD', fileUrl: 'https://example.com/docs/ins-a1-2026.pdf', uploadedBy: 'John Admin', uploadedAt: '2026-01-05T10:00:00Z', expiresAt: '2026-08-01' },
  { id: 'doc2', assetId: 'a1', name: 'TX Registration - Tractor #101', type: 'REGISTRATION', fileUrl: 'https://example.com/docs/reg-a1.pdf', uploadedBy: 'John Admin', uploadedAt: '2026-01-10T09:00:00Z', expiresAt: '2027-01-31' },
  { id: 'doc3', assetId: 'a1', name: 'DOT Annual Inspection Cert', type: 'INSPECTION_CERT', fileUrl: 'https://example.com/docs/dot-a1.pdf', uploadedBy: 'John Admin', uploadedAt: '2026-06-01T08:00:00Z', expiresAt: '2026-06-20' },
  { id: 'doc4', assetId: 'a3', name: 'Freightliner Cascadia Reg', type: 'REGISTRATION', fileUrl: 'https://example.com/docs/reg-a3.pdf', uploadedBy: 'Sarah Manager', uploadedAt: '2026-03-01T14:00:00Z', expiresAt: '2026-06-12' },
  { id: 'doc5', assetId: 'a2', name: 'Trailer Annual Inspection 2025', type: 'INSPECTION_CERT', fileUrl: 'https://example.com/docs/trailer-insp.pdf', uploadedBy: 'Dave Mechanic', uploadedAt: '2025-11-20T11:00:00Z', expiresAt: '2026-11-20' }
];

export const initialWarranties: Warranty[] = [
  { id: 'war1', assetId: 'a1', componentName: 'Cummins X15 Engine', provider: 'Cummins Inc.', warrantyNumber: 'CUM-2021-88901', startDate: '2021-03-15', expiryDate: '2026-03-15', coverageDetails: '5yr / 500k mi powertrain warranty. Covers engine block, heads, injectors.', status: 'EXPIRED' },
  { id: 'war2', assetId: 'a1', componentName: 'Eaton Fuller 18-Spd Transmission', provider: 'Eaton Corp', warrantyNumber: 'EAT-TX-2021-44120', startDate: '2021-03-15', expiryDate: '2027-03-15', coverageDetails: '6yr extended coverage. Covers gears, clutch pack, PTO shaft.', status: 'ACTIVE' },
  { id: 'war3', assetId: 'a3', componentName: 'Bendix Air Brakes System', provider: 'Bendix Commercial', warrantyNumber: 'BDX-2022-90012', startDate: '2022-07-20', expiryDate: '2026-07-20', coverageDetails: '4yr coverage. Covers ABS ECU, chambers, valves.', status: 'EXPIRING_SOON' },
  { id: 'war4', assetId: 'a2', componentName: 'Utility Trailer Frame & Body', provider: 'Utility Trailer Mfg', warrantyNumber: 'UTL-2020-11023', startDate: '2020-01-10', expiryDate: '2028-01-10', coverageDetails: '8yr structural warranty. Covers frame welds, cross members, landing gear.', status: 'ACTIVE' }
];


// Helper to initialize local storage
export const getStore = <T>(key: string, initial: T[]): T[] => {
  if (typeof window === 'undefined') return initial;
  const val = localStorage.getItem(key);
  if (!val) {
    localStorage.setItem(key, JSON.stringify(initial));
    return initial;
  }
  return JSON.parse(val);
};

export const setStore = <T>(key: string, data: T[]): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(data));
};

export const getMockDb = () => {
  return {
    users: getStore('users', initialUsers),
    assets: getStore('assets', initialAssets),
    components: getStore('components', initialComponents),
    inspections: getStore<EDVIRInspection>('inspections', []),
    pmTemplates: getStore('pmTemplates', initialPMTemplates),
    pmSchedules: getStore('pmSchedules', initialPMSchedules),
    serviceRequests: getStore<ServiceRequest>('serviceRequests', []),
    workOrders: getStore('workOrders', initialWorkOrders),
    purchaseOrders: getStore<PurchaseOrder>('purchaseOrders', []),
    renewalAlerts: getStore('renewalAlerts', initialRenewalAlerts),
    fuelLogs: getStore('fuelLogs', initialFuelLogs),
    tollRecords: getStore('tollRecords', initialTollRecords),
    dotInspections: getStore('dotInspections', initialDOTInspections),
    vendors: getStore('vendors', initialVendors),
    emergencyTickets: getStore('emergencyTickets', initialEmergencyTickets),
    faultCodes: getStore('faultCodes', initialFaultCodes),
    auditLogs: getStore('auditLogs', initialAuditLogs),
    notifications: getStore('notifications', initialNotifications),
    accidentClaims: getStore('accidentClaims', initialAccidentClaims),
    assignments: getStore('assignments', initialAssignments),
    tireReadings: getStore('tireReadings', initialTireReadings),
    expenseRecords: getStore('expenseRecords', initialExpenseRecords),
    replacementAnalysis: getStore('replacementAnalysis', initialReplacementAnalysis),
    issues: getStore('issues', initialIssues),
    contacts: getStore('contacts', initialContacts),
    parts: getStore('parts', initialParts),
    places: getStore('places', initialPlaces),
    documents: getStore('documents', initialDocuments),
    warranties: getStore('warranties', initialWarranties)
  };
};

export const mutators = {
  // Authentication
  login: (email: string): User | null => {
    const db = getMockDb();
    const u = db.users.find(x => x.email.toLowerCase() === email.toLowerCase());
    return u || null;
  },

  // eDVIR Inspection
  submitInspection: (data: { assetId: string; driverName: string; status: 'PASSED' | 'FAILED'; odometer: number; checklistJson: any; notes?: string }) => {
    const db = getMockDb();
    const inspection: EDVIRInspection = {
      id: 'insp-' + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      ...data
    };
    db.inspections.unshift(inspection);
    setStore('inspections', db.inspections);

    // Update asset odometer & status
    const assets = db.assets.map(a => {
      if (a.id === data.assetId) {
        let status = a.status;
        if (data.status === 'FAILED') {
          status = 'INOPERABLE';
          // Generate notification
          mutators.addNotification('COMPLIANCE', `Inspection Failed: ${a.name}`, `Driver ${data.driverName} failed inspections checklist: ${data.notes || 'no details'}`);
        }
        return {
          ...a,
          odometer: Math.max(a.odometer, data.odometer),
          status
        };
      }
      return a;
    });
    setStore('assets', assets);

    // Evaluate PM
    mutators.syncPMSchedules(data.assetId, data.odometer);
    mutators.logAudit(data.driverName, 'CREATE', 'Inspection', inspection.id);
    return inspection;
  },

  // Service Requests & Work Orders
  submitServiceRequest: (data: { assetId: string; driverName: string; description: string; mediaUrls: string[] }) => {
    const db = getMockDb();
    const req: ServiceRequest = {
      id: 'req-' + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      status: 'PENDING',
      ...data
    };
    db.serviceRequests.unshift(req);
    setStore('serviceRequests', db.serviceRequests);

    mutators.addNotification('WORK_ORDER', `New Driver Request`, `Request reported for asset. Reason: "${data.description}"`);
    mutators.logAudit(data.driverName, 'CREATE', 'ServiceRequest', req.id);
    return req;
  },

  approveRequest: (requestId: string, details: { type: 'INTERNAL' | 'EXTERNAL'; priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY'; description: string; assignedMechanicId?: string; vendorId?: string }, userName: string) => {
    const db = getMockDb();
    
    // Update request
    const reqs = db.serviceRequests.map(r => r.id === requestId ? { ...r, status: 'APPROVED' as const } : r);
    setStore('serviceRequests', reqs);

    const req = db.serviceRequests.find(r => r.id === requestId);
    if (!req) return null;

    // Create Work Order
    const wo: WorkOrder = {
      id: 'wo-' + Math.random().toString(36).substr(2, 9),
      serviceRequestId: requestId,
      assetId: req.assetId,
      type: details.type,
      priority: details.priority,
      description: details.description,
      assignedMechanicId: details.type === 'INTERNAL' ? details.assignedMechanicId : null,
      vendorId: details.type === 'EXTERNAL' ? details.vendorId : null,
      status: 'OPEN',
      laborCost: 0,
      partsCost: 0,
      totalCost: 0,
      createdAt: new Date().toISOString()
    };
    db.workOrders.unshift(wo);
    setStore('workOrders', db.workOrders);

    // If external, create PO
    if (details.type === 'EXTERNAL' && details.vendorId) {
      const po: PurchaseOrder = {
        id: 'po-' + Math.random().toString(36).substr(2, 9),
        workOrderId: wo.id,
        vendorId: details.vendorId,
        amount: 0,
        status: 'PENDING',
        createdAt: new Date().toISOString()
      };
      db.purchaseOrders.unshift(po);
      setStore('purchaseOrders', db.purchaseOrders);
    }

    // Update asset status
    const assets = db.assets.map(a => a.id === req.assetId ? { ...a, status: 'INOPERABLE' as const } : a);
    setStore('assets', assets);

    mutators.addNotification('WORK_ORDER', 'Work Order Created', `WO issued for repair: ${details.description}`);
    mutators.logAudit(userName, 'CREATE', 'WorkOrder', wo.id);
    return wo;
  },

  updateWorkOrder: (id: string, data: { status?: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED'; laborCost?: number; partsCost?: number }, userName: string) => {
    const db = getMockDb();
    
    const wos = db.workOrders.map(wo => {
      if (wo.id === id) {
        const labor = data.laborCost ?? wo.laborCost;
        const parts = data.partsCost ?? wo.partsCost;
        const totalCost = labor + parts;
        const status = data.status ?? wo.status;

        const updated = {
          ...wo,
          status,
          laborCost: labor,
          partsCost: parts,
          totalCost,
          completedAt: status === 'COMPLETED' ? new Date().toISOString() : wo.completedAt
        };

        // If completed, check asset status recovery
        if (status === 'COMPLETED') {
          // Recover asset
          setTimeout(() => {
            const innerDb = getMockDb();
            const activeWosCount = innerDb.workOrders.filter(w => w.assetId === wo.assetId && w.id !== id && w.status !== 'COMPLETED').length;
            if (activeWosCount === 0) {
              const freshAssets = innerDb.assets.map(a => a.id === wo.assetId ? { ...a, status: 'OPERABLE' as const } : a);
              setStore('assets', freshAssets);
            }
          }, 50);

          // Update PO amount if external
          if (wo.type === 'EXTERNAL') {
            const pos = getMockDb().purchaseOrders.map(p => p.workOrderId === id ? { ...p, amount: totalCost, status: 'APPROVED' as const } : p);
            setStore('purchaseOrders', pos);
          }
        }

        return updated;
      }
      return wo;
    });

    setStore('workOrders', wos);
    mutators.logAudit(userName, 'UPDATE', 'WorkOrder', id);
  },

  // PM Schedule sync
  syncPMSchedules: (assetId: string, currentOdometer: number) => {
    const db = getMockDb();
    const schedules = db.pmSchedules.map(s => {
      if (s.assetId === assetId) {
        const remainingMileage = s.nextDueOdometer - currentOdometer;
        const remainingDays = (new Date(s.nextDueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
        
        let status: 'COMPLIANT' | 'DUE' | 'OVERDUE' = 'COMPLIANT';
        if (remainingMileage <= 0 || remainingDays <= 0) {
          status = 'OVERDUE';
        } else if (remainingMileage <= 1000 || remainingDays <= 15) {
          status = 'DUE';
        }

        if (status !== s.status && (status === 'OVERDUE' || status === 'DUE')) {
          mutators.addNotification('PM_ALERT', 'PM Service Alert', `PM schedule is now ${status}. Sync checklist.`);
        }

        return { ...s, status };
      }
      return s;
    });
    setStore('pmSchedules', schedules);
  },

  performPM: (scheduleId: string, odometer: number, userName: string) => {
    const db = getMockDb();
    const schedules = db.pmSchedules.map(s => {
      if (s.id === scheduleId) {
        const template = db.pmTemplates.find(t => t.id === s.templateId);
        const triggerMileage = template ? template.triggerMileage : 10000;
        const triggerDays = template ? template.triggerDays : 90;

        return {
          ...s,
          lastServiceOdometer: odometer,
          lastServiceDate: new Date().toISOString().split('T')[0],
          nextDueOdometer: odometer + triggerMileage,
          nextDueDate: new Date(Date.now() + triggerDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'COMPLIANT' as const
        };
      }
      return s;
    });
    setStore('pmSchedules', schedules);
    
    mutators.logAudit(userName, 'UPDATE', 'PMPerformance', scheduleId);
  },

  // Emergency Breakdowns
  createEmergencyTicket: (data: { assetId: string; reporterName: string; description: string; gpsLatitude: number; gpsLongitude: number }) => {
    const db = getMockDb();
    
    // Find closest vendor
    let closestVendor = db.vendors[0];
    const ticket: EmergencyTicket = {
      id: 'emerg-' + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      status: 'OPEN',
      assignedVendorId: closestVendor ? closestVendor.id : null,
      mechanicEta: new Date(Date.now() + 35 * 60 * 1000).toISOString(), // 35 min ETA
      downtimeHours: 0,
      ...data
    };
    db.emergencyTickets.unshift(ticket);
    setStore('emergencyTickets', db.emergencyTickets);

    // Update asset
    const assets = db.assets.map(a => a.id === data.assetId ? { ...a, status: 'INOPERABLE' as const } : a);
    setStore('assets', assets);

    mutators.addNotification('BREAKDOWN', `Breakdown: Tractor Needs Dispatch`, `Emergency breakdown reported. Vendor dispatched: ${closestVendor?.name}`);
    mutators.logAudit(data.reporterName, 'CREATE', 'EmergencyTicket', ticket.id);
    return ticket;
  },

  updateEmergencyTicket: (id: string, data: { status: 'OPEN' | 'DISPATCHED' | 'COMPLETED'; downtimeHours: number }, userName: string) => {
    const db = getMockDb();
    const tickets = db.emergencyTickets.map(t => {
      if (t.id === id) {
        if (data.status === 'COMPLETED') {
          // Recover asset
          setTimeout(() => {
            const innerDb = getMockDb();
            const freshAssets = innerDb.assets.map(a => a.id === t.assetId ? { ...a, status: 'OPERABLE' as const } : a);
            setStore('assets', freshAssets);
          }, 50);
        }
        return {
          ...t,
          status: data.status,
          downtimeHours: data.downtimeHours
        };
      }
      return t;
    });
    setStore('emergencyTickets', tickets);
    mutators.logAudit(userName, 'UPDATE', 'EmergencyTicket', id);
  },

  // ELD Odometer and Fault Codes simulator
  telematicsOdometerUpdate: (assetId: string, odometer: number) => {
    const db = getMockDb();
    const assets = db.assets.map(a => a.id === assetId ? { ...a, odometer } : a);
    setStore('assets', assets);

    mutators.syncPMSchedules(assetId, odometer);
  },

  telematicsDtcCode: (assetId: string, source: string, code: string, desc: string) => {
    const db = getMockDb();
    
    // Add fault code
    const fault: FaultCode = {
      id: 'fc-' + Math.random().toString(36).substr(2, 9),
      assetId,
      source,
      code,
      description: desc,
      status: 'ACTIVE',
      createdAt: new Date().toISOString()
    };
    db.faultCodes.unshift(fault);
    setStore('faultCodes', db.faultCodes);

    // Set asset to NEEDS_ATTENTION
    const assets = db.assets.map(a => a.id === assetId ? { ...a, status: 'NEEDS_ATTENTION' as const } : a);
    setStore('assets', assets);

    // Auto-create Work Order
    const wo: WorkOrder = {
      id: 'wo-' + Math.random().toString(36).substr(2, 9),
      assetId,
      priority: 'MEDIUM',
      type: 'INTERNAL',
      status: 'OPEN',
      description: `Telematics Auto WO: Ingested DTC fault code ${code} - ${desc}`,
      laborCost: 0,
      partsCost: 0,
      totalCost: 0,
      createdAt: new Date().toISOString()
    };
    db.workOrders.unshift(wo);
    setStore('workOrders', db.workOrders);

    // Update fault code with wo id
    const faults = db.faultCodes.map(f => f.id === fault.id ? { ...f, workOrderId: wo.id } : f);
    setStore('faultCodes', faults);

    mutators.addNotification('WORK_ORDER', `Telematics Fault Ingested`, `Check engine code ${code} surfaced on engine telemetry.`);
    mutators.logAudit('ELD API', 'CREATE', 'FaultCode', fault.id);
  },

  // Accidents Claims
  submitAccidentClaim: (data: { assetId: string; driverName: string; policeReportNumber: string; statement: string; thirdPartyDetails: string; claimDate: string; insurancePayout: number; actualRepairCost: number }) => {
    const db = getMockDb();
    const claim: AccidentClaim = {
      id: 'claim-' + Math.random().toString(36).substr(2, 9),
      status: 'OPEN',
      ...data
    };
    db.accidentClaims.unshift(claim);
    setStore('accidentClaims', db.accidentClaims);

    // Create a work order for the repair
    const wo: WorkOrder = {
      id: 'wo-' + Math.random().toString(36).substr(2, 9),
      assetId: data.assetId,
      priority: 'HIGH',
      type: 'INTERNAL',
      status: 'OPEN',
      description: `Accident Collision Repairs. Police Report: ${data.policeReportNumber}`,
      laborCost: 0,
      partsCost: data.actualRepairCost,
      totalCost: data.actualRepairCost,
      createdAt: new Date().toISOString()
    };
    db.workOrders.unshift(wo);
    setStore('workOrders', db.workOrders);

    mutators.addNotification('COMPLIANCE', `Accident Claim Filed`, `Claim logged for asset with report #${data.policeReportNumber}`);
    mutators.logAudit(data.driverName, 'CREATE', 'AccidentClaim', claim.id);
  },

  // DOT Roadside
  submitDotAudit: (data: { assetId: string; result: 'CLEAN' | 'VIOLATION'; violationsJson: string[] }, userName: string) => {
    const db = getMockDb();
    const inspection: DOTInspection = {
      id: 'dot-' + Math.random().toString(36).substr(2, 9),
      inspectionDate: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      ...data
    };
    db.dotInspections.unshift(inspection);
    setStore('dotInspections', db.dotInspections);

    if (data.result === 'VIOLATION') {
      // Set asset status to INOPERABLE
      const assets = db.assets.map(a => a.id === data.assetId ? { ...a, status: 'INOPERABLE' as const } : a);
      setStore('assets', assets);

      // Create high priority work order
      const wo: WorkOrder = {
        id: 'wo-' + Math.random().toString(36).substr(2, 9),
        assetId: data.assetId,
        priority: 'HIGH',
        type: 'INTERNAL',
        status: 'OPEN',
        description: `DOT Roadside Violation Repairs: ${data.violationsJson.join(', ')}`,
        laborCost: 0,
        partsCost: 0,
        totalCost: 0,
        dotViolationId: inspection.id,
        createdAt: new Date().toISOString()
      };
      db.workOrders.unshift(wo);
      setStore('workOrders', db.workOrders);

      mutators.addNotification('COMPLIANCE', `DOT Violation Alert`, `Infraction reported. High-priority WO generated.`);
    }

    mutators.logAudit(userName, 'CREATE', 'DOTInspection', inspection.id);
  },

  // Dismiss renewal
  dismissRenewalAlert: (id: string, userName: string) => {
    const db = getMockDb();
    const alerts = db.renewalAlerts.map(a => a.id === id ? { ...a, status: 'DISMISSED' as const } : a);
    setStore('renewalAlerts', alerts);
    mutators.logAudit(userName, 'UPDATE', 'RenewalAlert', id);
  },

  // Asset Status Admin Override
  overrideAssetStatus: (id: string, status: 'OPERABLE' | 'NEEDS_ATTENTION' | 'INOPERABLE', userName: string) => {
    const db = getMockDb();
    const assets = db.assets.map(a => a.id === id ? { ...a, status } : a);
    setStore('assets', assets);
    mutators.logAudit(userName, 'OVERRIDE', 'AssetStatus', id);
  },

  // Helper logs
  logAudit: (userName: string, action: string, entityName: string, entityId: string) => {
    const db = getMockDb();
    const audit: AuditLog = {
      id: 'au-' + Math.random().toString(36).substr(2, 9),
      userName,
      action,
      entityName,
      entityId,
      timestamp: new Date().toISOString()
    };
    db.auditLogs.unshift(audit);
    setStore('auditLogs', db.auditLogs);
  },

  addNotification: (type: 'WORK_ORDER' | 'PM_ALERT' | 'BREAKDOWN' | 'COMPLIANCE', title: string, message: string) => {
    const db = getMockDb();
    const notif: SystemNotification = {
      id: 'n-' + Math.random().toString(36).substr(2, 9),
      type,
      title,
      message,
      timestamp: new Date().toISOString(),
      read: false
    };
    db.notifications.unshift(notif);
    setStore('notifications', db.notifications);
  }
};
