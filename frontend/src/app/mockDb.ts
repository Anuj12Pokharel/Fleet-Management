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

export interface ComplianceRenewal {
  id: string;
  scope: 'DRIVER' | 'EQUIPMENT' | 'CARRIER';
  type: string;
  title: string;
  description?: string | null;
  driverId?: string | null;
  driverName?: string | null;
  assetId?: string | null;
  assetName?: string | null;
  issueDate?: string | null;
  expiryDate?: string | null;
  alertLeadDays: number;
  targetMileage?: number | null;
  lastRecordedDate?: string | null;
  referenceNumber?: string | null;
  documentUrl?: string | null;
  notes?: string | null;
  metadataJson?: string | null;
  enteredById: string;
  enteredByName: string;
  enteredByRole: string;
  lastModifiedById?: string | null;
  lastModifiedByName?: string | null;
  lastModifiedByRole?: string | null;
  verificationStatus: 'ACTIVE' | 'PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED' | 'SELF_CERTIFIED';
  verifiedById?: string | null;
  verifiedByName?: string | null;
  verifiedAt?: string | null;
  rejectionReason?: string | null;
  createdAt?: string;
  updatedAt?: string;
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

export interface BrakeReading {
  id: string;
  assetId: string;
  axlePosition: 'STEER_LEFT' | 'STEER_RIGHT' | 'DRIVE1_LEFT' | 'DRIVE1_RIGHT' | 'DRIVE2_LEFT' | 'DRIVE2_RIGHT' | 'TRAILER_LEFT' | 'TRAILER_RIGHT';
  brakeType: 'DRUM' | 'DISC';
  liningThickness: number; // in 32nds of an inch (min legal: 8/32" steer, 4/32" drive/trailer)
  pushrodStroke: number; // in inches (max legal: 2.0" for standard chamber)
  drumCondition: 'GOOD' | 'HEAT_CHECKED' | 'SCORED' | 'CRACKED';
  brakeTemp?: number; // degrees F
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

// ── Configuration & Domain Settings Interfaces ──────────────────────────────

export interface BillingProfile {
  orgName: string;
  contactName: string;
  email: string;
  taxId: string;
  address: string;
  paymentMethod: string;
}

export interface PrimaryPlan {
  planName: string;
  billingCycle: string;
  status: 'TRIAL_ENDED' | 'ACTIVE' | 'PAST_DUE';
  currentVehicles: number;
  maxVehicles: number;
  pricePerVehicle: number;
}

export interface GeneralSettingsConfig {
  companyName: string;
  logoUrl: string;
  timezone: string;
  dateFormat: string;
  baseCurrency: string;
  unitSystem: 'IMPERIAL' | 'METRIC';
}

export interface VehicleStatusConfig {
  id: string;
  name: string;
  color: string;
  type: 'OPERABLE' | 'NEEDS_ATTENTION' | 'INOPERABLE' | 'IN_SHOP' | 'ARCHIVED';
  description: string;
}

export interface VehicleTypeConfig {
  id: string;
  name: string;
  category: 'TRUCK' | 'TRAILER' | 'VAN' | 'EQUIPMENT' | 'OTHER';
  fuelType: string;
  description: string;
  expectedLifeMiles: number;
}

export interface ExternalVehicleIdConfig {
  id: string;
  assetId: string;
  systemName: string;
  externalId: string;
  notes: string;
}

export interface ExpenseSettingsConfig {
  currency: string;
  taxInclusive: boolean;
  approvalThreshold: number;
  requireReceipt: boolean;
}

export interface InspectionSettingsConfig {
  requirePhotoOnFailure: boolean;
  requireDigitalSignature: boolean;
  autoCreateWorkOrder: boolean;
  gracePeriodDays: number;
}

export interface IssuePriorityConfig {
  id: string;
  name: string;
  slaHours: number;
  color: string;
  autoEscalate: boolean;
}

export interface FaultRuleConfig {
  id: string;
  source: string;
  codePattern: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  action: 'AUTO_WORK_ORDER' | 'NOTIFY_ONLY' | 'CREATE_ISSUE' | 'IGNORE';
  enabled: boolean;
}

export interface ReminderSettingsConfig {
  leadDistanceMiles: number;
  leadTimeDays: number;
  snoozeLimitDays: number;
  emailAlerts: boolean;
}

export interface RenewalTypeConfig {
  id: string;
  name: string;
  target: 'VEHICLE' | 'CONTACT';
  defaultLeadDays: number;
  requiredDocs: string;
}

export interface MaintenanceSettingsConfig {
  defaultLaborRate: number;
  partsMarkupPercent: number;
  woNumberPrefix: string;
  requirePoThreshold: number;
}

export interface ReasonForRepairCode {
  id: string;
  code: string;
  description: string;
  category: 'SCHEDULED' | 'UNSCHEDULED' | 'ACCIDENT' | 'BREAKDOWN' | 'RECALL';
}

export interface RepairPriorityClassCode {
  id: string;
  code: string;
  name: string;
  description: string;
}

export interface VmrsCode {
  id: string;
  systemCode: string;
  systemName: string;
  assemblyCode: string;
  assemblyName: string;
  componentCode: string;
  componentName: string;
}

export interface SmartAssessmentConfig {
  aiAuditEnabled: boolean;
  laborBenchmarkTolerancePercent: number;
  partsMarkupAlertThreshold: number;
}

export interface PartLocationConfig {
  id: string;
  name: string;
  type: 'WAREHOUSE' | 'SHOP_BIN' | 'MOBILE_TRUCK' | 'DEPOT';
  address: string;
  capacity: number;
}

export interface PartCategoryConfig {
  id: string;
  name: string;
  code: string;
  description: string;
}

export interface PartManufacturerConfig {
  id: string;
  name: string;
  country: string;
  contactInfo: string;
  isPreferred: boolean;
}

export interface MeasurementUnitConfig {
  id: string;
  name: string;
  symbol: string;
  type: 'QUANTITY' | 'VOLUME' | 'WEIGHT' | 'LENGTH';
}

export interface FuelEnergySettingsConfig {
  minMpgThreshold: number;
  maxMpgThreshold: number;
  tankCapacityCheck: boolean;
  evKwhFactor: number;
}

export interface FuelTypeConfig {
  id: string;
  name: string;
  unit: string;
  isRenewable: boolean;
  avgPricePerUnit: number;
}

export interface SavedReportConfig {
  id: string;
  title: string;
  category: 'IFTA' | 'OPERATIONS' | 'MAINTENANCE' | 'FINANCIAL' | 'SAFETY';
  schedule: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'MANUAL';
  recipients: string;
  lastRun: string;
  format: 'CSV' | 'PDF' | 'EXCEL';
}

export interface SecuritySettingsConfig {
  twoFactorRequired: boolean;
  sessionTimeoutMinutes: number;
  passwordMinLength: number;
  requireSpecialChar: boolean;
  ipWhitelist: string;
}

export interface RoleDefinition {
  id: string;
  roleName: string;
  description: string;
  userCount: number;
  permissions: {
    assets: { view: boolean; create: boolean; edit: boolean; delete: boolean; approve: boolean };
    workOrders: { view: boolean; create: boolean; edit: boolean; delete: boolean; approve: boolean };
    inspections: { view: boolean; create: boolean; edit: boolean; delete: boolean; approve: boolean };
    fuel: { view: boolean; create: boolean; edit: boolean; delete: boolean; approve: boolean };
    parts: { view: boolean; create: boolean; edit: boolean; delete: boolean; approve: boolean };
    reports: { view: boolean; create: boolean; edit: boolean; delete: boolean; approve: boolean };
    billing: { view: boolean; create: boolean; edit: boolean; delete: boolean; approve: boolean };
  };
}

export interface RecordSetConfig {
  id: string;
  name: string;
  description: string;
  assetCount: number;
  assignedUsers: string[];
}

export interface AIAdvisorSettingsConfig {
  predictiveEnabled: boolean;
  sensitivity: 'LOW' | 'MEDIUM' | 'HIGH';
  diagnosticAssistant: boolean;
  estimateAuditing: boolean;
}

export interface AIHealthInsight {
  id: string;
  assetId: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  prediction: string;
  recommendation: string;
  confidenceScore: number;
  date: string;
}

export interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  events: string[];
  secret: string;
  status: 'ACTIVE' | 'PAUSED' | 'FAILED';
  lastTriggered: string;
}

export interface IntegrationLinkConfig {
  id: string;
  provider: 'SAMSARA' | 'MOTIVE' | 'GEOTAB' | 'WEX' | 'PREPASS' | 'QUICKBOOKS' | 'SAP';
  name: string;
  status: 'CONNECTED' | 'DISCONNECTED' | 'SYNCING';
  category: 'TELEMATICS' | 'FUEL_CARDS' | 'TOLLS' | 'ACCOUNTING';
  lastSync: string;
}

export interface SAMLSettingsConfig {
  enabled: boolean;
  idpEntityId: string;
  ssoUrl: string;
  certificateUploaded: boolean;
  autoProvisionUsers: boolean;
}

export interface CustomFieldConfig {
  id: string;
  entity: 'ASSET' | 'WORK_ORDER' | 'PART' | 'INSPECTION' | 'CONTACT';
  fieldName: string;
  fieldType: 'TEXT' | 'NUMBER' | 'DROPDOWN' | 'DATE' | 'CHECKBOX';
  required: boolean;
  options?: string[];
}

export interface FleetGroupConfig {
  id: string;
  name: string;
  parentId?: string | null;
  leader: string;
  assetCount: number;
}

export interface LabelTagConfig {
  id: string;
  name: string;
  color: string;
  appliedCount: number;
}

export interface SavedViewConfig {
  id: string;
  module: string;
  name: string;
  isDefault: boolean;
  filtersJson: string;
}

export interface SandboxConfig {
  id: string;
  name: string;
  status: 'ACTIVE' | 'IDLE' | 'SYNCING';
  createdAt: string;
  lastSynced: string;
}

// Real Dataset Placeholders (Entity data loaded live from NestJS API)
export const initialUsers: User[] = [];
export const initialAssets: Asset[] = [];
export const initialComponents: Component[] = [];
export const initialPMTemplates: PMTemplate[] = [];
export const initialPMSchedules: PMSchedule[] = [];
export const initialRenewalAlerts: RenewalAlert[] = [];
export const initialComplianceRenewals: ComplianceRenewal[] = [];
export const initialVendors: Vendor[] = [];
export const initialFuelLogs: FuelLog[] = [];
export const initialTollRecords: TollRecord[] = [];
export const initialDOTInspections: DOTInspection[] = [];
export const initialWorkOrders: WorkOrder[] = [];
export const initialEmergencyTickets: EmergencyTicket[] = [];
export const initialFaultCodes: FaultCode[] = [];
export const initialAuditLogs: AuditLog[] = [];
export const initialNotifications: SystemNotification[] = [];
export const initialAccidentClaims: AccidentClaim[] = [];
export const initialAssignments: VehicleAssignment[] = [];
export const initialTireReadings: TireReading[] = [];
export const initialBrakeReadings: BrakeReading[] = [];
export const initialExpenseRecords: ExpenseRecord[] = [];
export const initialReplacementAnalysis: ReplacementAnalysis[] = [];
export const initialIssues: Issue[] = [];
export const initialContacts: Contact[] = [];
export const initialParts: Part[] = [];
export const initialPlaces: Place[] = [];
export const initialDocuments: FleetDocument[] = [];
export const initialWarranties: Warranty[] = [];

// Initial Configuration Datasets
export const initialBillingProfile: BillingProfile = {
  orgName: '',
  contactName: '',
  email: '',
  taxId: '',
  address: '',
  paymentMethod: ''
};

export const initialPrimaryPlan: PrimaryPlan = {
  planName: 'Fleet Management System',
  billingCycle: 'Annual',
  status: 'ACTIVE',
  currentVehicles: 0,
  maxVehicles: 50,
  pricePerVehicle: 0
};

export const initialGeneralSettings: GeneralSettingsConfig = {
  companyName: 'Fleet Management System',
  logoUrl: '',
  timezone: 'America/Chicago (CST)',
  dateFormat: 'MM/DD/YYYY',
  baseCurrency: 'USD ($)',
  unitSystem: 'IMPERIAL'
};

export const initialVehicleStatuses: VehicleStatusConfig[] = [
  { id: 'vs1', name: 'Operable', color: 'bg-emerald-500 text-white', type: 'OPERABLE', description: 'Active and ready for driver dispatch.' },
  { id: 'vs2', name: 'Needs Attention', color: 'bg-amber-500 text-black', type: 'NEEDS_ATTENTION', description: 'Minor defect reported or service reminder due.' },
  { id: 'vs3', name: 'Inoperable / Out of Service', color: 'bg-rose-500 text-white', type: 'INOPERABLE', description: 'Critical defect, failed inspection or safety lockdown.' },
  { id: 'vs4', name: 'In Shop (Maintenance)', color: 'bg-[#00BA7C] text-white', type: 'IN_SHOP', description: 'Currently undergoing internal or vendor shop repair.' },
  { id: 'vs5', name: 'Sold / Archived', color: 'bg-slate-500 text-white', type: 'ARCHIVED', description: 'Asset retired or liquidated from fleet roster.' }
];

export const initialVehicleTypes: VehicleTypeConfig[] = [
  { id: 'vt1', name: 'Class 8 Heavy Duty Tractor', category: 'TRUCK', fuelType: 'Diesel', description: 'Sleeper & Daycab Highway Haulers (Peterbilt, Freightliner, Kenworth)', expectedLifeMiles: 750000 },
  { id: 'vt2', name: 'Dry Van Trailer 53ft', category: 'TRAILER', fuelType: 'None', description: 'Standard 53ft Enclosed Tandem Cargo Trailer', expectedLifeMiles: 500000 },
  { id: 'vt3', name: 'Refrigerated Reefer Trailer', category: 'TRAILER', fuelType: 'Diesel', description: 'Temperature-controlled reefer unit with Thermo King / Carrier engine', expectedLifeMiles: 400000 },
  { id: 'vt4', name: 'Medium Duty Box Truck', category: 'TRUCK', fuelType: 'Diesel', description: '26ft Straight Truck for Regional & Metro Delivery', expectedLifeMiles: 300000 },
  { id: 'vt5', name: 'Cargo Delivery Van', category: 'VAN', fuelType: 'Unleaded', description: 'Sprinter / Transit High Roof Last Mile Van', expectedLifeMiles: 200000 }
];

export const initialExternalVehicleIds: ExternalVehicleIdConfig[] = [];

export const initialExpenseSettings: ExpenseSettingsConfig = {
  currency: 'USD ($)',
  taxInclusive: false,
  approvalThreshold: 500,
  requireReceipt: true
};

export const initialInspectionSettings: InspectionSettingsConfig = {
  requirePhotoOnFailure: true,
  requireDigitalSignature: true,
  autoCreateWorkOrder: true,
  gracePeriodDays: 1
};

export const initialIssuePriorities: IssuePriorityConfig[] = [
  { id: 'ip1', name: 'Critical (Safety Hazard)', slaHours: 4, color: 'text-rose-600 bg-rose-50 border-rose-200', autoEscalate: true },
  { id: 'ip2', name: 'High Priority', slaHours: 12, color: 'text-orange-600 bg-orange-50 border-orange-200', autoEscalate: true },
  { id: 'ip3', name: 'Medium Priority', slaHours: 24, color: 'text-amber-600 bg-amber-50 border-amber-200', autoEscalate: false },
  { id: 'ip4', name: 'Low Priority', slaHours: 72, color: 'text-slate-600 bg-slate-50 border-slate-200', autoEscalate: false }
];

export const initialFaultRules: FaultRuleConfig[] = [
  { id: 'fr1', source: 'Motive', codePattern: 'SPN 110*', severity: 'HIGH', action: 'AUTO_WORK_ORDER', enabled: true },
  { id: 'fr2', source: 'Samsara', codePattern: 'SPN 651*', severity: 'CRITICAL', action: 'AUTO_WORK_ORDER', enabled: true },
  { id: 'fr3', source: 'Geotab', codePattern: 'P0300*', severity: 'MEDIUM', action: 'CREATE_ISSUE', enabled: true },
  { id: 'fr4', source: 'Motive', codePattern: 'SPN 96*', severity: 'LOW', action: 'NOTIFY_ONLY', enabled: false }
];

export const initialReminderSettings: ReminderSettingsConfig = {
  leadDistanceMiles: 500,
  leadTimeDays: 14,
  snoozeLimitDays: 7,
  emailAlerts: true
};

export const initialVehicleRenewalTypes: RenewalTypeConfig[] = [
  { id: 'vrt1', name: 'Federal DOT Annual Inspection', target: 'VEHICLE', defaultLeadDays: 30, requiredDocs: 'DOT Certificate & Brake Test Sheet' },
  { id: 'vrt2', name: 'IRP Cab Card Registration', target: 'VEHICLE', defaultLeadDays: 45, requiredDocs: 'State IRP Cab Card Copy' },
  { id: 'vrt3', name: 'Commercial Liability Insurance', target: 'VEHICLE', defaultLeadDays: 30, requiredDocs: 'Acord 25 Certificate of Insurance' },
  { id: 'vrt4', name: 'IFTA Annual Fuel Decal', target: 'VEHICLE', defaultLeadDays: 60, requiredDocs: 'State IFTA License & Decal Proof' }
];

export const initialContactRenewalTypes: RenewalTypeConfig[] = [
  { id: 'crt1', name: 'CDL Class A License Renewal', target: 'CONTACT', defaultLeadDays: 60, requiredDocs: 'State CDL Copy (Front & Back)' },
  { id: 'crt2', name: 'DOT Medical Examiner Certificate', target: 'CONTACT', defaultLeadDays: 30, requiredDocs: 'Medical Examiner Report MCSA-5876' },
  { id: 'crt3', name: 'TWIC Port Security Card', target: 'CONTACT', defaultLeadDays: 45, requiredDocs: 'TSA TWIC Card Identification' },
  { id: 'crt4', name: 'Hazmat Endorsement Training', target: 'CONTACT', defaultLeadDays: 30, requiredDocs: 'Hazmat Certification Certificate' }
];

export const initialMaintenanceSettings: MaintenanceSettingsConfig = {
  defaultLaborRate: 125.00,
  partsMarkupPercent: 15,
  woNumberPrefix: 'WO-',
  requirePoThreshold: 1000.00
};

export const initialReasonForRepairCodes: ReasonForRepairCode[] = [
  { id: 'rc1', code: 'PM-ROUTINE', description: 'Scheduled Preventative Maintenance Service', category: 'SCHEDULED' },
  { id: 'rc2', code: 'DRV-REPORT', description: 'Driver Pre-Trip / Post-Trip Defect Report', category: 'UNSCHEDULED' },
  { id: 'rc3', code: 'INSP-FAIL', description: 'eDVIR Inspection Checklist Item Failure', category: 'UNSCHEDULED' },
  { id: 'rc4', code: 'ROAD-BREAK', description: 'Emergency Roadside Breakdown Incident', category: 'BREAKDOWN' },
  { id: 'rc5', code: 'DOT-VIOL', description: 'Roadside State DOT Scale / Law Enforcement Citation', category: 'UNSCHEDULED' },
  { id: 'rc6', code: 'ACC-COLL', description: 'Accident Collision & Body Damage Repair', category: 'ACCIDENT' },
  { id: 'rc7', code: 'OEM-RECALL', description: 'Manufacturer Safety Recall Campaign', category: 'RECALL' }
];

export const initialRepairPriorityCodes: RepairPriorityClassCode[] = [
  { id: 'rpc1', code: 'EMERGENCY', name: 'Emergency Roadside (Immediate)', description: 'Vehicle stopped on highway / urgent mobile dispatch' },
  { id: 'rpc2', code: 'SAFETY_CRITICAL', name: 'Safety Critical (Lockdown)', description: 'Brakes, steering or tyres compromised. Cannot operate.' },
  { id: 'rpc3', code: 'UNSCHEDULED', name: 'Unscheduled Maintenance', description: 'Repair required before next dispatch cycle' },
  { id: 'rpc4', code: 'SCHEDULED', name: 'Routine Scheduled PM', description: 'Standard interval servicing & filter changes' }
];

export const initialVmrsCodes: VmrsCode[] = [
  { id: 'vmrs1', systemCode: '013', systemName: 'Brakes & Wheels', assemblyCode: '001', assemblyName: 'Front Brake Assembly', componentCode: '014', componentName: 'Brake Drum / Rotor' },
  { id: 'vmrs2', systemCode: '013', systemName: 'Brakes & Wheels', assemblyCode: '002', assemblyName: 'Air Brake System', componentCode: '022', componentName: 'Air Brake Chamber (Type 30/30)' },
  { id: 'vmrs3', systemCode: '042', systemName: 'Engine & Cooling', assemblyCode: '004', assemblyName: 'Radiator & Hoses', componentCode: '010', componentName: 'Water Pump Assembly' },
  { id: 'vmrs4', systemCode: '044', systemName: 'Fuel System', assemblyCode: '001', assemblyName: 'Fuel Supply & Injection', componentCode: '035', componentName: 'Fuel Injector Nozzle' },
  { id: 'vmrs5', systemCode: '034', systemName: 'Lighting & Electrical', assemblyCode: '002', assemblyName: 'Headlights & Turn Signals', componentCode: '005', componentName: 'LED Headlamp Cluster' }
];

export const initialSmartAssessmentConfig: SmartAssessmentConfig = {
  aiAuditEnabled: true,
  laborBenchmarkTolerancePercent: 20,
  partsMarkupAlertThreshold: 25
};

export const initialPartLocations: PartLocationConfig[] = [
  { id: 'ploc1', name: 'Main Shop Facility - Warehouse A', type: 'WAREHOUSE', address: '1200 Logistics Blvd, Dallas TX', capacity: 500 },
  { id: 'ploc2', name: 'Parts Cage Bin B1-B10', type: 'SHOP_BIN', address: 'Main Shop, Dallas TX', capacity: 150 },
  { id: 'ploc3', name: 'Mobile Service Truck #1 (Ford F-550)', type: 'MOBILE_TRUCK', address: 'Mobile Unit - North Texas Route', capacity: 45 },
  { id: 'ploc4', name: 'Houston Terminal Storage Bay', type: 'DEPOT', address: '4500 Port Access Rd, Houston TX', capacity: 200 }
];

export const initialPartCategories: PartCategoryConfig[] = [
  { id: 'pcat1', name: 'Filters (Oil, Fuel, Air, Cabin)', code: 'FILTERS', description: 'Primary and secondary engine filtration media' },
  { id: 'pcat2', name: 'Brakes & Friction', code: 'BRAKES', description: 'Brake drums, shoes, pads, chambers, air valves' },
  { id: 'pcat3', name: 'Tires & Wheels', code: 'TIRES', description: 'Steer, drive, trailer tires, rims and valve stems' },
  { id: 'pcat4', name: 'Fluids & Lubricants', code: 'FLUIDS', description: '15W-40 Oil, Coolant, DEF, Grease, Gear Lube' },
  { id: 'pcat5', name: 'Engine Components', code: 'ENGINE', description: 'Turbos, belts, sensors, alternators, starters' },
  { id: 'pcat6', name: 'Electrical & Lighting', code: 'ELECTRICAL', description: 'Fuses, harnesses, batteries, LED lights' }
];

export const initialPartManufacturers: PartManufacturerConfig[] = [
  { id: 'pmfg1', name: 'Bendix Commercial Vehicle Systems', country: 'USA', contactInfo: 'bendix-parts@kars.com', isPreferred: true },
  { id: 'pmfg2', name: 'Cummins Genuine Parts', country: 'USA', contactInfo: 'cummins-fleet@cummins.com', isPreferred: true },
  { id: 'pmfg3', name: 'Fleetguard Filtration', country: 'USA', contactInfo: 'support@fleetguard.com', isPreferred: true },
  { id: 'pmfg4', name: 'Michelin North America', country: 'USA', contactInfo: 'commercial@michelin.com', isPreferred: true },
  { id: 'pmfg5', name: 'Eaton Corporation', country: 'USA', contactInfo: 'transmissions@eaton.com', isPreferred: true }
];

export const initialMeasurementUnits: MeasurementUnitConfig[] = [
  { id: 'mu1', name: 'Each', symbol: 'ea', type: 'QUANTITY' },
  { id: 'mu2', name: 'US Gallons', symbol: 'gal', type: 'VOLUME' },
  { id: 'mu3', name: 'Quarts', symbol: 'qt', type: 'VOLUME' },
  { id: 'mu4', name: 'Box / Pack', symbol: 'box', type: 'QUANTITY' },
  { id: 'mu5', name: 'Feet', symbol: 'ft', type: 'LENGTH' },
  { id: 'mu6', name: 'Pounds', symbol: 'lb', type: 'WEIGHT' }
];

export const initialFuelEnergySettings: FuelEnergySettingsConfig = {
  minMpgThreshold: 4.5,
  maxMpgThreshold: 9.0,
  tankCapacityCheck: true,
  evKwhFactor: 33.7
};

export const initialFuelTypes: FuelTypeConfig[] = [
  { id: 'ft1', name: 'Ultra-Low Sulfur Diesel #2', unit: 'Gallons', isRenewable: false, avgPricePerUnit: 3.85 },
  { id: 'ft2', name: 'Diesel Exhaust Fluid (DEF)', unit: 'Gallons', isRenewable: false, avgPricePerUnit: 2.75 },
  { id: 'ft3', name: 'Unleaded Regular (87 Octane)', unit: 'Gallons', isRenewable: false, avgPricePerUnit: 3.10 },
  { id: 'ft4', name: 'Biodiesel Blend (B20)', unit: 'Gallons', isRenewable: true, avgPricePerUnit: 3.90 },
  { id: 'ft5', name: 'Commercial EV Fast Charge', unit: 'kWh', isRenewable: true, avgPricePerUnit: 0.22 }
];

export const initialSavedReports: SavedReportConfig[] = [];

export const initialSecuritySettings: SecuritySettingsConfig = {
  twoFactorRequired: false,
  sessionTimeoutMinutes: 60,
  passwordMinLength: 8,
  requireSpecialChar: true,
  ipWhitelist: ''
};

export const initialRoleDefinitions: RoleDefinition[] = [
  {
    id: 'role-fm',
    roleName: 'Fleet Manager',
    description: 'Full supervisory authority across all vehicles, finances, billing, and reporting.',
    userCount: 0,
    permissions: {
      assets: { view: true, create: true, edit: true, delete: true, approve: true },
      workOrders: { view: true, create: true, edit: true, delete: true, approve: true },
      inspections: { view: true, create: true, edit: true, delete: true, approve: true },
      fuel: { view: true, create: true, edit: true, delete: true, approve: true },
      parts: { view: true, create: true, edit: true, delete: true, approve: true },
      reports: { view: true, create: true, edit: true, delete: true, approve: true },
      billing: { view: true, create: true, edit: true, delete: true, approve: true }
    }
  },
  {
    id: 'role-ma',
    roleName: 'Maintenance Admin',
    description: 'Manages shop work orders, preventative maintenance, parts inventory, and compliance.',
    userCount: 0,
    permissions: {
      assets: { view: true, create: true, edit: true, delete: false, approve: true },
      workOrders: { view: true, create: true, edit: true, delete: false, approve: true },
      inspections: { view: true, create: true, edit: true, delete: false, approve: true },
      fuel: { view: true, create: true, edit: true, delete: false, approve: false },
      parts: { view: true, create: true, edit: true, delete: true, approve: true },
      reports: { view: true, create: true, edit: false, delete: false, approve: false },
      billing: { view: false, create: false, edit: false, delete: false, approve: false }
    }
  },
  {
    id: 'role-mech',
    roleName: 'Mechanic Technician',
    description: 'Performs shop inspections, logs labor and parts usage on assigned work orders.',
    userCount: 0,
    permissions: {
      assets: { view: true, create: false, edit: false, delete: false, approve: false },
      workOrders: { view: true, create: false, edit: true, delete: false, approve: false },
      inspections: { view: true, create: true, edit: false, delete: false, approve: false },
      fuel: { view: false, create: false, edit: false, delete: false, approve: false },
      parts: { view: true, create: false, edit: true, delete: false, approve: false },
      reports: { view: false, create: false, edit: false, delete: false, approve: false },
      billing: { view: false, create: false, edit: false, delete: false, approve: false }
    }
  },
  {
    id: 'role-drv',
    roleName: 'Commercial Driver',
    description: 'Submits daily eDVIR checklists, fuel card receipts, and roadside breakdown tickets.',
    userCount: 0,
    permissions: {
      assets: { view: true, create: false, edit: false, delete: false, approve: false },
      workOrders: { view: false, create: false, edit: false, delete: false, approve: false },
      inspections: { view: true, create: true, edit: false, delete: false, approve: false },
      fuel: { view: true, create: true, edit: false, delete: false, approve: false },
      parts: { view: false, create: false, edit: false, delete: false, approve: false },
      reports: { view: false, create: false, edit: false, delete: false, approve: false },
      billing: { view: false, create: false, edit: false, delete: false, approve: false }
    }
  }
];

export const initialRecordSets: RecordSetConfig[] = [];

export const initialAIAdvisorSettings: AIAdvisorSettingsConfig = {
  predictiveEnabled: true,
  sensitivity: 'HIGH',
  diagnosticAssistant: true,
  estimateAuditing: true
};

export const initialAIHealthInsights: AIHealthInsight[] = [];

export const initialWebhooks: WebhookConfig[] = [];

export const initialIntegrationLinks: IntegrationLinkConfig[] = [];

export const initialSAMLSettings: SAMLSettingsConfig = {
  enabled: false,
  idpEntityId: '',
  ssoUrl: '',
  certificateUploaded: false,
  autoProvisionUsers: true
};

export const initialCustomFields: CustomFieldConfig[] = [];

export const initialFleetGroups: FleetGroupConfig[] = [];

export const initialLabels: LabelTagConfig[] = [];

export const initialSavedViews: SavedViewConfig[] = [];

export const initialSandboxes: SandboxConfig[] = [];

// Helper to initialize local storage
export const getStore = <T>(key: string, initial: T[]): T[] => {
  if (typeof window === 'undefined') return initial;
  const val = localStorage.getItem(key);
  if (!val) {
    localStorage.setItem(key, JSON.stringify(initial));
    return initial;
  }
  try {
    return JSON.parse(val);
  } catch (e) {
    return initial;
  }
};

export const setStore = <T>(key: string, data: T[]): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(data));
};

export const getSingleStore = <T>(key: string, initial: T): T => {
  if (typeof window === 'undefined') return initial;
  const val = localStorage.getItem(key);
  if (!val) {
    localStorage.setItem(key, JSON.stringify(initial));
    return initial;
  }
  try {
    return JSON.parse(val);
  } catch (e) {
    return initial;
  }
};

export const setSingleStore = <T>(key: string, data: T): void => {
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
    complianceRenewals: getStore('complianceRenewals', initialComplianceRenewals),
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
    brakeReadings: getStore('brakeReadings', initialBrakeReadings),
    expenseRecords: getStore('expenseRecords', initialExpenseRecords),
    replacementAnalysis: getStore('replacementAnalysis', initialReplacementAnalysis),
    issues: getStore('issues', initialIssues),
    contacts: getStore('contacts', initialContacts),
    parts: getStore('parts', initialParts),
    places: getStore('places', initialPlaces),
    documents: getStore('documents', initialDocuments),
    warranties: getStore('warranties', initialWarranties),
    billingProfile: getSingleStore('billingProfile', initialBillingProfile),
    primaryPlan: getSingleStore('primaryPlan', initialPrimaryPlan),
    generalSettings: getSingleStore('generalSettings', initialGeneralSettings),
    vehicleStatuses: getStore('vehicleStatuses', initialVehicleStatuses),
    vehicleTypes: getStore('vehicleTypes', initialVehicleTypes),
    externalVehicleIds: getStore('externalVehicleIds', initialExternalVehicleIds),
    expenseSettings: getSingleStore('expenseSettings', initialExpenseSettings),
    inspectionSettings: getSingleStore('inspectionSettings', initialInspectionSettings),
    issuePriorities: getStore('issuePriorities', initialIssuePriorities),
    faultRules: getStore('faultRules', initialFaultRules),
    reminderSettings: getSingleStore('reminderSettings', initialReminderSettings),
    vehicleRenewalTypes: getStore('vehicleRenewalTypes', initialVehicleRenewalTypes),
    contactRenewalTypes: getStore('contactRenewalTypes', initialContactRenewalTypes),
    maintenanceSettings: getSingleStore('maintenanceSettings', initialMaintenanceSettings),
    reasonForRepairCodes: getStore('reasonForRepairCodes', initialReasonForRepairCodes),
    repairPriorityCodes: getStore('repairPriorityCodes', initialRepairPriorityCodes),
    vmrsCodes: getStore('vmrsCodes', initialVmrsCodes),
    smartAssessmentConfig: getSingleStore('smartAssessmentConfig', initialSmartAssessmentConfig),
    partLocations: getStore('partLocations', initialPartLocations),
    partCategories: getStore('partCategories', initialPartCategories),
    partManufacturers: getStore('partManufacturers', initialPartManufacturers),
    measurementUnits: getStore('measurementUnits', initialMeasurementUnits),
    fuelEnergySettings: getSingleStore('fuelEnergySettings', initialFuelEnergySettings),
    fuelTypes: getStore('fuelTypes', initialFuelTypes),
    savedReports: getStore('savedReports', initialSavedReports),
    securitySettings: getSingleStore('securitySettings', initialSecuritySettings),
    roleDefinitions: getStore('roleDefinitions', initialRoleDefinitions),
    recordSets: getStore('recordSets', initialRecordSets),
    aiAdvisorSettings: getSingleStore('aiAdvisorSettings', initialAIAdvisorSettings),
    aiHealthInsights: getStore('aiHealthInsights', initialAIHealthInsights),
    webhooks: getStore('webhooks', initialWebhooks),
    integrationLinks: getStore('integrationLinks', initialIntegrationLinks),
    samlSettings: getSingleStore('samlSettings', initialSAMLSettings),
    customFields: getStore('customFields', initialCustomFields),
    fleetGroups: getStore('fleetGroups', initialFleetGroups),
    labels: getStore('labels', initialLabels),
    savedViews: getStore('savedViews', initialSavedViews),
    sandboxes: getStore('sandboxes', initialSandboxes)
  };
};

export const mutators = {};
