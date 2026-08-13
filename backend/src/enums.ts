export enum Role {
  DRIVER = 'DRIVER',
  MECHANIC = 'MECHANIC',
  MAINTENANCE_ADMIN = 'MAINTENANCE_ADMIN',
  FLEET_MANAGER = 'FLEET_MANAGER',
}

export enum AssetType {
  TRACTOR = 'TRACTOR',
  TRAILER = 'TRAILER',
}

export enum AssetStatus {
  OPERABLE = 'OPERABLE',
  NEEDS_ATTENTION = 'NEEDS_ATTENTION',
  INOPERABLE = 'INOPERABLE',
}

export enum InspectionStatus {
  PASSED = 'PASSED',
  FAILED = 'FAILED',
}

export enum PMStatus {
  COMPLIANT = 'COMPLIANT',
  DUE = 'DUE',
  OVERDUE = 'OVERDUE',
}

export enum RequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum WorkOrderStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

export enum WorkOrderPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  EMERGENCY = 'EMERGENCY',
}

export enum WorkOrderType {
  INTERNAL = 'INTERNAL',
  EXTERNAL = 'EXTERNAL',
}

export enum PurchaseOrderStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  PAID = 'PAID',
}

export enum RenewalType {
  DOT_ANNUAL_INSPECTION = 'DOT_ANNUAL_INSPECTION',
  IRP_REGISTRATION = 'IRP_REGISTRATION',
  INSURANCE_POLICY = 'INSURANCE_POLICY',
}

export enum RenewalStatus {
  ACTIVE = 'ACTIVE',
  DISMISSED = 'DISMISSED',
  EXPIRED = 'EXPIRED',
}

export enum VendorType {
  HEAVY_DUTY_SHOP = 'HEAVY_DUTY_SHOP',
  TYRE_SPECIALIST = 'TYRE_SPECIALIST',
  MOBILE_ROADSIDE_SERVICE = 'MOBILE_ROADSIDE_SERVICE',
  INDEPENDENT_MECHANIC = 'INDEPENDENT_MECHANIC',
  DOT_INSPECTOR = 'DOT_INSPECTOR',
}

export enum EmergencyStatus {
  OPEN = 'OPEN',
  DISPATCHED = 'DISPATCHED',
  COMPLETED = 'COMPLETED',
}

export enum FaultStatus {
  ACTIVE = 'ACTIVE',
  RESOLVED = 'RESOLVED',
}

export enum ClaimStatus {
  OPEN = 'OPEN',
  SETTLED = 'SETTLED',
}
