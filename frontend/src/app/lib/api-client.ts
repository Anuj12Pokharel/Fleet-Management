/**
 * Fleet Management System — NestJS Backend API Client
 * Base URL: http://localhost:5000/api
 */

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// ─── Token & Auth Storage ───────────────────────────────────────────────────

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('fleet_jwt_token');
}

export function saveAuthToken(token: string, user: any) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('fleet_jwt_token', token);
  localStorage.setItem('fleet_user', JSON.stringify(user));
}

export function removeAuthToken() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('fleet_jwt_token');
  localStorage.removeItem('fleet_user');
}

export function getStoredUser(): any | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('fleet_user');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// ─── Interfaces ─────────────────────────────────────────────────────────────

export interface ApiUser {
  id: string;
  email: string;
  name: string;
  role: 'DRIVER' | 'MECHANIC' | 'MAINTENANCE_ADMIN' | 'FLEET_MANAGER';
  createdAt?: string;
}

export interface ApiAsset {
  id: string;
  type: 'TRACTOR' | 'TRAILER';
  name: string;
  vin: string;
  plateNumber: string;
  status: 'OPERABLE' | 'NEEDS_ATTENTION' | 'INOPERABLE';
  odometer: number;
  fuelType: string;
  qrCodeUrl?: string | null;
  parentAssetId?: string | null;
  parentAsset?: ApiAsset | null;
  createdAt?: string;
}

export interface ApiEDVIRInspection {
  id: string;
  assetId: string;
  asset?: ApiAsset;
  driverId: string;
  driver?: ApiUser;
  status: 'PASSED' | 'FAILED';
  odometer: number;
  checklistJson: string; // JSON string
  notes?: string | null;
  createdAt: string;
}

export interface ApiPMTemplate {
  id: string;
  name: string;
  description: string;
  triggerMileage: number;
  triggerDays: number;
  stepsJson: string;
  createdAt?: string;
}

export interface ApiPMSchedule {
  id: string;
  assetId: string;
  asset?: ApiAsset;
  templateId: string;
  template?: ApiPMTemplate;
  lastServiceOdometer: number;
  lastServiceDate: string;
  nextDueOdometer: number;
  nextDueDate: string;
  status: 'COMPLIANT' | 'DUE' | 'OVERDUE';
}

export interface ApiServiceRequest {
  id: string;
  assetId: string;
  asset?: ApiAsset;
  driverId: string;
  driver?: ApiUser;
  description: string;
  mediaUrls: string; // JSON string array
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

export interface ApiWorkOrder {
  id: string;
  serviceRequestId?: string | null;
  serviceRequest?: ApiServiceRequest | null;
  assetId: string;
  asset?: ApiAsset;
  componentId?: string | null;
  assignedMechanicId?: string | null;
  assignedMechanic?: ApiUser | null;
  type: 'INTERNAL' | 'EXTERNAL';
  vendorId?: string | null;
  vendor?: ApiVendor | null;
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

export interface ApiRenewalAlert {
  id: string;
  assetId: string;
  asset?: ApiAsset;
  type: 'DOT_ANNUAL_INSPECTION' | 'IRP_REGISTRATION' | 'INSURANCE_POLICY';
  description: string;
  expiryDate: string;
  status: 'ACTIVE' | 'DISMISSED' | 'EXPIRED';
}

export interface ApiFuelLog {
  id: string;
  assetId: string;
  asset?: ApiAsset;
  cardTransactionId: string;
  gallons: number;
  cost: number;
  location: string;
  odometer: number;
  mpg: number;
  isAnomaly: boolean;
  createdAt: string;
}

export interface ApiTollRecord {
  id: string;
  assetId: string;
  asset?: ApiAsset;
  transponderId: string;
  amount: number;
  location: string;
  timestamp: string;
}

export interface ApiDOTInspection {
  id: string;
  assetId: string;
  asset?: ApiAsset;
  inspectionDate: string;
  result: 'CLEAN' | 'VIOLATION';
  violationsJson: string; // JSON string array
  createdAt: string;
}

export interface ApiVendor {
  id: string;
  name: string;
  type: 'HEAVY_DUTY_SHOP' | 'TYRE_SPECIALIST' | 'MOBILE_ROADSIDE_SERVICE' | 'INDEPENDENT_MECHANIC' | 'DOT_INSPECTOR';
  negotiatedRate: number;
  contactInfo: string;
  invoiceHistory: string; // JSON string array
}

export interface ApiEmergencyTicket {
  id: string;
  assetId: string;
  asset?: ApiAsset;
  reporterId: string;
  reporter?: ApiUser;
  description: string;
  gpsLatitude: number;
  gpsLongitude: number;
  status: 'OPEN' | 'DISPATCHED' | 'COMPLETED';
  assignedVendorId?: string | null;
  mechanicEta?: string | null;
  downtimeHours: number;
  createdAt: string;
}

export interface ApiFaultCode {
  id: string;
  assetId: string;
  asset?: ApiAsset;
  source: string;
  code: string;
  description: string;
  status: 'ACTIVE' | 'RESOLVED';
  workOrderId?: string | null;
  createdAt: string;
}

export interface ApiAccidentClaim {
  id: string;
  assetId: string;
  asset?: ApiAsset;
  driverId: string;
  driver?: ApiUser;
  policeReportNumber: string;
  statement: string;
  thirdPartyDetails: string;
  insurancePayout: number;
  actualRepairCost: number;
  status: 'OPEN' | 'SETTLED';
  claimDate: string;
  createdAt: string;
}

export interface ApiAuditLog {
  id: string;
  userId?: string | null;
  userName?: string;
  user?: ApiUser | null;
  action: string;
  entityName: string;
  entityId: string;
  timestamp: string;
}

export interface ApiSystemNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

// ─── Generic Fetch Helper ─────────────────────────────────────────────────────

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) ?? {}),
  };

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => '');
    let msg = `HTTP ${res.status}: ${res.statusText}`;
    try {
      const parsed = JSON.parse(errorText);
      if (parsed.message) msg = Array.isArray(parsed.message) ? parsed.message.join(', ') : parsed.message;
    } catch {
      if (errorText) msg = errorText;
    }
    throw new Error(msg);
  }

  if (res.status === 204) return undefined as unknown as T;
  return res.json() as Promise<T>;
}

// ─── API Methods ─────────────────────────────────────────────────────────────

// Auth
export async function apiLogin(email: string, password: string) {
  const data = await apiFetch<{ access_token: string; user: ApiUser }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  saveAuthToken(data.access_token, data.user);
  return data;
}

export async function apiRegister(data: { name: string; email: string; password: string; role: string }) {
  return apiFetch<ApiUser>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: data.name,
      email: data.email,
      password: data.password,
      role: data.role,
    }),
  });
}

export async function apiGetUsers(): Promise<ApiUser[]> {
  return apiFetch<ApiUser[]>('/auth/users');
}

// Assets
export async function apiGetAssets(): Promise<ApiAsset[]> {
  return apiFetch<ApiAsset[]>('/assets');
}

export async function apiCreateAsset(asset: Partial<ApiAsset>): Promise<ApiAsset> {
  return apiFetch<ApiAsset>('/assets', {
    method: 'POST',
    body: JSON.stringify(asset),
  });
}

export async function apiUpdateAsset(id: string, data: Partial<ApiAsset>): Promise<ApiAsset> {
  return apiFetch<ApiAsset>(`/assets/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function apiOverrideAssetStatus(id: string, status: string): Promise<ApiAsset> {
  return apiFetch<ApiAsset>(`/assets/${id}/override`, {
    method: 'POST',
    body: JSON.stringify({ status }),
  });
}

// Inspections (eDVIR)
export async function apiGetInspections(): Promise<ApiEDVIRInspection[]> {
  return apiFetch<ApiEDVIRInspection[]>('/inspections');
}

export async function apiCreateInspection(payload: {
  assetId: string;
  status: string;
  odometer: number;
  checklistJson: Record<string, string>;
  notes?: string;
}): Promise<ApiEDVIRInspection> {
  return apiFetch<ApiEDVIRInspection>('/inspections', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// PM
export async function apiGetPMTemplates(): Promise<ApiPMTemplate[]> {
  return apiFetch<ApiPMTemplate[]>('/pm/templates');
}

export async function apiGetPMSchedules(): Promise<ApiPMSchedule[]> {
  return apiFetch<ApiPMSchedule[]>('/pm/schedules');
}

export async function apiCalculatePMDue(assetId: string, currentOdometer: number): Promise<ApiPMSchedule[]> {
  return apiFetch<ApiPMSchedule[]>('/pm/calculate-due', {
    method: 'POST',
    body: JSON.stringify({ assetId, currentOdometer }),
  });
}

// Work Orders & Service Requests
export async function apiGetServiceRequests(): Promise<ApiServiceRequest[]> {
  return apiFetch<ApiServiceRequest[]>('/service-requests');
}

export async function apiCreateServiceRequest(payload: {
  assetId: string;
  description: string;
  mediaUrls: string[];
}): Promise<ApiServiceRequest> {
  return apiFetch<ApiServiceRequest>('/service-requests', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function apiApproveServiceRequest(
  id: string,
  woData: {
    type: string;
    priority: string;
    description: string;
    assignedMechanicId?: string;
    vendorId?: string;
  }
): Promise<ApiWorkOrder> {
  return apiFetch<ApiWorkOrder>(`/service-requests/${id}/approve`, {
    method: 'POST',
    body: JSON.stringify(woData),
  });
}

export async function apiGetWorkOrders(): Promise<ApiWorkOrder[]> {
  return apiFetch<ApiWorkOrder[]>('/work-orders');
}

export async function apiUpdateWorkOrder(id: string, data: Partial<ApiWorkOrder>): Promise<ApiWorkOrder> {
  return apiFetch<ApiWorkOrder>(`/work-orders/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// Renewals
export async function apiGetRenewalAlerts(): Promise<ApiRenewalAlert[]> {
  return apiFetch<ApiRenewalAlert[]>('/renewals');
}

export async function apiDismissRenewalAlert(id: string): Promise<ApiRenewalAlert> {
  return apiFetch<ApiRenewalAlert>(`/renewals/${id}/dismiss`, {
    method: 'POST',
  });
}

// Fuel & Tolls
export async function apiGetFuelLogs(): Promise<ApiFuelLog[]> {
  return apiFetch<ApiFuelLog[]>('/fuel-logs');
}

export async function apiCreateFuelLog(payload: {
  assetId: string;
  gallons: number;
  cost: number;
  location: string;
  odometer: number;
  cardTransactionId?: string;
}): Promise<ApiFuelLog> {
  return apiFetch<ApiFuelLog>('/fuel-logs', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function apiGetFuelAnomalies(): Promise<ApiFuelLog[]> {
  return apiFetch<ApiFuelLog[]>('/fuel-logs/anomalies');
}

export async function apiGetTollRecords(): Promise<ApiTollRecord[]> {
  return apiFetch<ApiTollRecord[]>('/fuel-logs/toll-records');
}

// DOT
export async function apiGetDOTInspections(): Promise<ApiDOTInspection[]> {
  return apiFetch<ApiDOTInspection[]>('/dot');
}

// Vendors
export async function apiGetVendors(): Promise<ApiVendor[]> {
  return apiFetch<ApiVendor[]>('/vendors');
}

// Emergencies & Fault Codes
export async function apiGetEmergencyTickets(): Promise<ApiEmergencyTicket[]> {
  return apiFetch<ApiEmergencyTicket[]>('/work-orders/emergency-tickets');
}

export async function apiCreateEmergencyTicket(payload: {
  assetId: string;
  description: string;
  gpsLatitude: number;
  gpsLongitude: number;
}): Promise<ApiEmergencyTicket> {
  return apiFetch<ApiEmergencyTicket>('/work-orders/emergency-tickets', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function apiGetFaultCodes(): Promise<ApiFaultCode[]> {
  return apiFetch<ApiFaultCode[]>('/work-orders/fault-codes');
}

// Accident Claims
export async function apiGetAccidentClaims(): Promise<ApiAccidentClaim[]> {
  return apiFetch<ApiAccidentClaim[]>('/accidents');
}

export async function apiCreateAccidentClaim(payload: {
  assetId: string;
  policeReportNumber: string;
  statement: string;
  thirdPartyDetails: string;
  insurancePayout: number;
  actualRepairCost: number;
}): Promise<ApiAccidentClaim> {
  return apiFetch<ApiAccidentClaim>('/accidents', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// Audit Logs & Notifications
export async function apiGetAuditLogs(): Promise<ApiAuditLog[]> {
  return apiFetch<ApiAuditLog[]>('/audit-logs');
}

export async function apiGetNotifications(): Promise<ApiSystemNotification[]> {
  return apiFetch<ApiSystemNotification[]>('/notifications');
}

export async function apiMarkNotificationRead(id: string): Promise<ApiSystemNotification> {
  return apiFetch<ApiSystemNotification>(`/notifications/${id}/read`, {
    method: 'POST',
  });
}

// Telematics Webhooks
export async function apiTriggerOdometerWebhook(assetId: string, odometer: number) {
  return apiFetch<{ message: string; assetId: string; odometer: number }>('/telematics/odometer-webhook', {
    method: 'POST',
    body: JSON.stringify({ assetId, odometer }),
  });
}

export async function apiTriggerDtcWebhook(assetId: string, code: string, description: string) {
  return apiFetch<{ message: string; faultCode: ApiFaultCode; workOrder: ApiWorkOrder }>('/telematics/dtc-webhook', {
    method: 'POST',
    body: JSON.stringify({ assetId, code, description }),
  });
}

// Reports
export async function apiGetTcoReport() {
  return apiFetch<any[]>('/reports/tco');
}

export async function apiGetPmComplianceReport() {
  return apiFetch<any>('/reports/pm-compliance');
}

export async function apiGetDotTrendReport() {
  return apiFetch<any[]>('/reports/dot-violation-trends');
}
