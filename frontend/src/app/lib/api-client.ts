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

export interface ApiComplianceRenewal {
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
  daysLeft?: number | null;
  urgency?: 'CRITICAL' | 'WARNING' | 'INFO' | 'OK' | 'NO_EXPIRY';
  createdAt?: string;
  updatedAt?: string;
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

export interface ApiPart {
  id: string;
  partNumber: string;
  name: string;
  category: 'ENGINE' | 'BRAKES' | 'ELECTRICAL' | 'FILTERS' | 'TIRES' | 'FLUIDS' | 'BODY' | 'HVAC' | 'OTHER';
  stockQty: number;
  reorderLevel: number;
  unitCost: number;
  location?: string | null;
  compatibleAssetsJson?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiPartLocation {
  id: string;
  name: string;
  type: 'WAREHOUSE' | 'SHOP_BIN' | 'MOBILE_TRUCK' | 'DEPOT';
  address?: string | null;
  capacity: number;
  createdAt?: string;
}

export interface ApiPartCategory {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  createdAt?: string;
}

export interface ApiPartManufacturer {
  id: string;
  name: string;
  country: string;
  contactInfo?: string | null;
  isPreferred: boolean;
  createdAt?: string;
}

export interface ApiMeasurementUnit {
  id: string;
  name: string;
  symbol: string;
  type: 'QUANTITY' | 'VOLUME' | 'LENGTH' | 'WEIGHT';
  createdAt?: string;
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
  checklistJson: Record<string, any>;
  notes?: string;
}): Promise<ApiEDVIRInspection> {
  return apiFetch<ApiEDVIRInspection>('/inspections', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function apiMechanicSignOff(id: string, notes?: string, clearInoperable: boolean = true): Promise<ApiEDVIRInspection> {
  return apiFetch<ApiEDVIRInspection>(`/inspections/${id}/mechanic-signoff`, {
    method: 'POST',
    body: JSON.stringify({ notes, clearInoperable }),
  });
}

export async function apiDriverReview(id: string): Promise<ApiEDVIRInspection> {
  return apiFetch<ApiEDVIRInspection>(`/inspections/${id}/driver-review`, {
    method: 'POST',
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

export async function apiPerformPM(scheduleId: string, odometer: number): Promise<ApiPMSchedule> {
  return apiFetch<ApiPMSchedule>(`/pm/schedules/${scheduleId}/perform`, {
    method: 'POST',
    body: JSON.stringify({ odometer }),
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

export async function apiCreateWorkOrder(data: {
  assetId: string;
  priority: string;
  type?: string;
  description: string;
  assignedMechanicId?: string;
  vendorId?: string;
}): Promise<ApiWorkOrder> {
  return apiFetch<ApiWorkOrder>('/work-orders', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function apiUpdateWorkOrder(id: string, data: Partial<ApiWorkOrder>): Promise<ApiWorkOrder> {
  return apiFetch<ApiWorkOrder>(`/work-orders/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function apiAddPartToWorkOrder(workOrderId: string, partId: string, quantity: number = 1): Promise<ApiWorkOrder> {
  return apiFetch<ApiWorkOrder>(`/work-orders/${workOrderId}/parts`, {
    method: 'POST',
    body: JSON.stringify({ partId, quantity }),
  });
}

export async function apiRemovePartFromWorkOrder(lineItemId: string): Promise<ApiWorkOrder> {
  return apiFetch<ApiWorkOrder>(`/work-orders/parts/${lineItemId}`, {
    method: 'DELETE',
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

export async function apiGetComplianceRenewals(params?: {
  scope?: string;
  driverId?: string;
  assetId?: string;
  status?: string;
  verificationStatus?: string;
  search?: string;
}): Promise<ApiComplianceRenewal[]> {
  const query = new URLSearchParams();
  if (params?.scope) query.set('scope', params.scope);
  if (params?.driverId) query.set('driverId', params.driverId);
  if (params?.assetId) query.set('assetId', params.assetId);
  if (params?.status) query.set('status', params.status);
  if (params?.verificationStatus) query.set('verificationStatus', params.verificationStatus);
  if (params?.search) query.set('search', params.search);
  const qStr = query.toString();
  return apiFetch<ApiComplianceRenewal[]>(`/renewals${qStr ? `?${qStr}` : ''}`);
}

export async function apiGetRenewalsSummary(): Promise<{
  overdue: number;
  critical: number;
  warning: number;
  healthy: number;
  pendingVerification: number;
  total: number;
}> {
  return apiFetch<any>('/renewals/summary');
}

export async function apiSaveComplianceRenewalAdmin(payload: Partial<ApiComplianceRenewal>): Promise<ApiComplianceRenewal> {
  return apiFetch<ApiComplianceRenewal>('/renewals/admin/save', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function apiDeleteComplianceRenewal(id: string): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>(`/renewals/admin/${id}`, {
    method: 'DELETE',
  });
}

export async function apiSubmitDriverRenewal(payload: Partial<ApiComplianceRenewal>): Promise<ApiComplianceRenewal> {
  return apiFetch<ApiComplianceRenewal>('/renewals/driver/submit', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function apiSubmitEquipmentRenewal(payload: Partial<ApiComplianceRenewal>): Promise<ApiComplianceRenewal> {
  return apiFetch<ApiComplianceRenewal>('/renewals/equipment/submit', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function apiVerifyComplianceRenewal(
  id: string,
  approved: boolean,
  notes?: string,
): Promise<ApiComplianceRenewal> {
  return apiFetch<ApiComplianceRenewal>(`/renewals/${id}/verify`, {
    method: 'POST',
    body: JSON.stringify({ approved, notes }),
  });
}

// Fuel & Tolls
export async function apiGetFuelLogs(): Promise<ApiFuelLog[]> {
  return apiFetch<ApiFuelLog[]>('/fuel/logs');
}

export async function apiCreateFuelLog(payload: {
  assetId: string;
  gallons: number;
  cost: number;
  location: string;
  odometer: number;
  cardTransactionId?: string;
}): Promise<ApiFuelLog> {
  return apiFetch<ApiFuelLog>('/fuel/webhook', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function apiGetFuelAnomalies(): Promise<ApiFuelLog[]> {
  const logs = await apiGetFuelLogs();
  return (logs || []).filter(l => l.isAnomaly);
}

// ── Relay Payments TMS Fuel API Integration ──
export interface RelayFuelStatus {
  connected: boolean;
  environment: string;
  apiKeyMasked: string;
  baseUrl: string;
  policiesCount: number;
  message?: string;
  error?: string;
}

export interface RelayOneTimeCode {
  id: string;
  code: string;
  constraint_amount: string;
  type: string;
  status: string;
  driver_id: string | null;
  note: string;
  created_at: string;
}

export async function apiGetRelayFuelStatus(): Promise<RelayFuelStatus> {
  return apiFetch<RelayFuelStatus>('/fuel/relay/status');
}

export async function apiGetRelayPolicies(): Promise<any[]> {
  return apiFetch<any[]>('/fuel/relay/policies');
}

export async function apiGetRelayDrivers(q?: string): Promise<any[]> {
  const url = q ? `/fuel/relay/drivers?q=${encodeURIComponent(q)}` : '/fuel/relay/drivers';
  return apiFetch<any[]>(url);
}

export async function apiGetRelayFuelCodes(dtstart?: string, dtend?: string): Promise<RelayOneTimeCode[]> {
  const params = new URLSearchParams();
  if (dtstart) params.set('dtstart', dtstart);
  if (dtend) params.set('dtend', dtend);
  const q = params.toString() ? `?${params.toString()}` : '';
  return apiFetch<RelayOneTimeCode[]>(`/fuel/relay/codes${q}`);
}

export async function apiCreateRelayFuelCode(payload: {
  constraint_amount: string;
  driver_id?: string;
  note?: string;
  location_id?: string;
  type?: 'fuel' | 'cash';
}): Promise<RelayOneTimeCode> {
  return apiFetch<RelayOneTimeCode>('/fuel/relay/codes', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function apiSyncRelayFuelTransactions(): Promise<{
  success: boolean;
  totalFetched: number;
  imported: number;
  skipped: number;
}> {
  return apiFetch<{ success: boolean; totalFetched: number; imported: number; skipped: number }>('/fuel/relay/sync', {
    method: 'POST',
  });
}

export async function apiGetRelayTransactions(dtstart?: string, dtend?: string): Promise<any[]> {
  const params = new URLSearchParams();
  if (dtstart) params.set('dtstart', dtstart);
  if (dtend) params.set('dtend', dtend);
  const q = params.toString() ? `?${params.toString()}` : '';
  return apiFetch<any[]>(`/fuel/relay/transactions${q}`);
}

export async function apiGetTollRecords(): Promise<ApiTollRecord[]> {
  return apiFetch<ApiTollRecord[]>('/tolls');
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
  return apiFetch<ApiEmergencyTicket[]>('/emergency');
}

export async function apiCreateEmergencyTicket(payload: {
  assetId: string;
  description: string;
  gpsLatitude: number;
  gpsLongitude: number;
}): Promise<ApiEmergencyTicket> {
  return apiFetch<ApiEmergencyTicket>('/emergency', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function apiUpdateEmergencyTicket(id: string, payload: {
  status: string;
  downtimeHours?: number;
}): Promise<ApiEmergencyTicket> {
  return apiFetch<ApiEmergencyTicket>(`/emergency/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function apiGetFaultCodes(): Promise<ApiFaultCode[]> {
  return apiFetch<ApiFaultCode[]>('/telematics/fault-codes');
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
  claimDate?: string;
  insurancePayout?: number;
  actualRepairCost?: number;
}): Promise<ApiAccidentClaim> {
  return apiFetch<ApiAccidentClaim>('/accidents', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export interface ApiClaimEvidence {
  id: string;
  claimId: string;
  kind: 'PHOTO' | 'VIDEO' | 'REPORT' | 'OTHER';
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  createdAt: string;
}

export function apiAssetUrl(path: string): string {
  return `${API_BASE_URL.replace(/\/api\/?$/, '')}${path}`;
}

export async function apiUploadClaimEvidence(claimId: string, file: File, kind?: string): Promise<ApiClaimEvidence> {
  const token = getAuthToken();
  const form = new FormData();
  form.append('file', file);
  if (kind) form.append('kind', kind);
  const res = await fetch(`${API_BASE_URL}/accidents/${claimId}/evidence`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    let msg = `HTTP ${res.status}`;
    try { const p = JSON.parse(t); if (p.message) msg = Array.isArray(p.message) ? p.message.join(', ') : p.message; } catch { if (t) msg = t; }
    throw new Error(msg);
  }
  return res.json();
}

export async function apiDeleteClaimEvidence(evidenceId: string): Promise<void> {
  await apiFetch(`/accidents/evidence/${evidenceId}`, { method: 'DELETE' });
}

// HOS / ELD
export type HosStatus = 'OFF_DUTY' | 'SLEEPER_BERTH' | 'DRIVING' | 'ON_DUTY';
export interface ApiHosLog {
  id: string;
  driverId: string;
  assetId?: string | null;
  status: HosStatus;
  startedAt: string;
  endedAt?: string | null;
  location: string;
  odometer: number;
  certified: boolean;
}
export interface ApiHosClocks {
  driverId: string;
  currentStatus: HosStatus | null;
  since: string | null;
  driveMinutesLeft: number;
  shiftMinutesLeft: number;
  breakMinutesLeft: number;
  cycleMinutesLeft: number;
  violations: string[];
}
export const apiGetHosLogs = (days = 8) => apiFetch<ApiHosLog[]>(`/hos/logs?days=${days}`);
export const apiGetHosClocks = () => apiFetch<ApiHosClocks>('/hos/clocks');
export const apiSetHosStatus = (p: { status: HosStatus; location?: string; odometer?: number; assetId?: string }) =>
  apiFetch<ApiHosLog>('/hos/status', { method: 'POST', body: JSON.stringify(p) });
export const apiCertifyHos = () => apiFetch<{ certified: number }>('/hos/certify', { method: 'POST', body: JSON.stringify({}) });
export const apiCertifyHosLogs = apiCertifyHos;

// Safety scorecard
export interface ApiSafetyScorecard {
  generatedAt: string;
  safetyIndex: number;
  tier: string;
  powerUnits: number;
  inspections: { total: number; violations: number; cleanRate: number | null };
  claims: { count: number; totalRepairCost: number; totalPayout: number; netLoss: number; perUnitPerYear: number };
  drivers: { total: number; withHosLogs: number };
  indices: { key: string; label: string; pct: number; threshold: number; status: 'OK' | 'WATCH' | 'ALERT'; basis: string }[];
  policies: { id: string; description: string; assetId: string; expiryDate: string; daysLeft: number; status: string }[];
}
export const apiGetSafetyScorecard = () => apiFetch<ApiSafetyScorecard>('/safety/scorecard');

// IFTA
export interface ApiIftaQuarterly {
  year: number;
  quarter: number;
  fleetMpg: number;
  totals: { miles: number; gallons: number; netTax: number };
  rows: { jurisdiction: string; miles: number; gallons: number; cost: number; rate: number | null; taxableGallons: number; netGallons: number; netTax: number | null }[];
  unratedJurisdictions: string[];
  method: string;
}
export const apiGetIftaQuarterly = (year?: number, quarter?: number) =>
  apiFetch<ApiIftaQuarterly>(`/fuel/ifta/quarterly${year && quarter ? `?year=${year}&quarter=${quarter}` : ''}`);

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
  return apiFetch<{ id: string; name: string; odometer: number }>('/telematics/odometer', {
    method: 'POST',
    body: JSON.stringify({ assetId, odometer }),
  });
}

export async function apiTriggerDtcWebhook(assetId: string, code: string, description: string) {
  return apiFetch<{ fault: ApiFaultCode; workOrder: ApiWorkOrder }>('/telematics/fault-code', {
    method: 'POST',
    body: JSON.stringify({ assetId, source: 'Motive-ELD', code, description }),
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

// ─── Parts & Inventory API ───────────────────────────────────────────────────

export async function apiGetParts(): Promise<ApiPart[]> {
  return apiFetch<ApiPart[]>('/parts');
}

export async function apiGetPart(id: string): Promise<ApiPart> {
  return apiFetch<ApiPart>(`/parts/${id}`);
}

export async function apiCreatePart(payload: {
  partNumber: string;
  name: string;
  category: string;
  stockQty?: number;
  reorderLevel?: number;
  unitCost?: number;
  location?: string;
  compatibleAssetsJson?: string;
}): Promise<ApiPart> {
  return apiFetch<ApiPart>('/parts', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function apiUpdatePart(id: string, payload: Partial<ApiPart>): Promise<ApiPart> {
  return apiFetch<ApiPart>(`/parts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function apiUsePart(id: string, qty: number, workOrderId?: string): Promise<ApiPart> {
  return apiFetch<ApiPart>(`/parts/${id}/use`, {
    method: 'POST',
    body: JSON.stringify({ qty, workOrderId }),
  });
}

export async function apiRestockPart(id: string, qty: number): Promise<ApiPart> {
  return apiFetch<ApiPart>(`/parts/${id}/restock`, {
    method: 'POST',
    body: JSON.stringify({ qty }),
  });
}

export async function apiDeletePart(id: string): Promise<{ success: boolean; message: string }> {
  return apiFetch<{ success: boolean; message: string }>(`/parts/${id}`, {
    method: 'DELETE',
  });
}

// Part Locations
export async function apiGetPartLocations(): Promise<ApiPartLocation[]> {
  return apiFetch<ApiPartLocation[]>('/parts/locations');
}

export async function apiCreatePartLocation(payload: {
  name: string;
  type: string;
  address?: string;
  capacity?: number;
}): Promise<ApiPartLocation> {
  return apiFetch<ApiPartLocation>('/parts/locations', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// Part Categories
export async function apiGetPartCategories(): Promise<ApiPartCategory[]> {
  return apiFetch<ApiPartCategory[]>('/parts/categories');
}

export async function apiCreatePartCategory(payload: {
  name: string;
  code: string;
  description?: string;
}): Promise<ApiPartCategory> {
  return apiFetch<ApiPartCategory>('/parts/categories', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// Part Manufacturers
export async function apiGetPartManufacturers(): Promise<ApiPartManufacturer[]> {
  return apiFetch<ApiPartManufacturer[]>('/parts/manufacturers');
}

export async function apiCreatePartManufacturer(payload: {
  name: string;
  country?: string;
  contactInfo?: string;
  isPreferred?: boolean;
}): Promise<ApiPartManufacturer> {
  return apiFetch<ApiPartManufacturer>('/parts/manufacturers', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// Measurement Units
export async function apiGetMeasurementUnits(): Promise<ApiMeasurementUnit[]> {
  return apiFetch<ApiMeasurementUnit[]>('/parts/units');
}

export async function apiCreateMeasurementUnit(payload: {
  name: string;
  symbol: string;
  type: string;
}): Promise<ApiMeasurementUnit> {
  return apiFetch<ApiMeasurementUnit>('/parts/units', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ─── Vehicle Assignments ───────────────────────────────────────────────────

export interface ApiAssignment {
  id: string;
  assetId: string;
  driverId: string;
  driverName: string;
  startDate: string;
  endDate?: string | null;
  notes?: string;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  createdAt?: string;
}

export async function apiGetAssignments(): Promise<ApiAssignment[]> {
  return apiFetch<ApiAssignment[]>('/assignments');
}

export async function apiCreateAssignment(payload: Partial<ApiAssignment>): Promise<ApiAssignment> {
  return apiFetch<ApiAssignment>('/assignments', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function apiUpdateAssignment(id: string, payload: Partial<ApiAssignment>): Promise<ApiAssignment> {
  return apiFetch<ApiAssignment>(`/assignments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function apiDeleteAssignment(id: string): Promise<any> {
  return apiFetch(`/assignments/${id}`, { method: 'DELETE' });
}

// ─── Tire Readings ─────────────────────────────────────────────────────────

export interface ApiTireReading {
  id: string;
  assetId: string;
  axlePosition: string;
  tireBrand: string;
  psi: number;
  treadDepth: number;
  recordedAt: string;
  recordedBy: string;
}

export async function apiGetTireReadings(assetId?: string): Promise<ApiTireReading[]> {
  const query = assetId ? `?assetId=${encodeURIComponent(assetId)}` : '';
  return apiFetch<ApiTireReading[]>(`/tires${query}`);
}

export async function apiCreateTireReading(payload: Partial<ApiTireReading>): Promise<ApiTireReading> {
  return apiFetch<ApiTireReading>('/tires', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function apiDeleteTireReading(id: string): Promise<any> {
  return apiFetch(`/tires/${id}`, { method: 'DELETE' });
}

// ─── Brake Readings ────────────────────────────────────────────────────────

export interface ApiBrakeReading {
  id: string;
  assetId: string;
  axlePosition: string;
  brakeType: 'DRUM' | 'DISC';
  liningThickness: number; // in 32nds
  pushrodStroke: number; // in inches
  drumCondition: 'GOOD' | 'HEAT_CHECKED' | 'SCORED' | 'CRACKED';
  brakeTemp?: number;
  recordedAt: string;
  recordedBy: string;
}

export async function apiGetBrakeReadings(assetId?: string): Promise<ApiBrakeReading[]> {
  const query = assetId ? `?assetId=${encodeURIComponent(assetId)}` : '';
  try {
    return await apiFetch<ApiBrakeReading[]>(`/brakes${query}`);
  } catch {
    // LocalStorage fallback for seamless offline operation
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('fleet_store_brakeReadings');
      if (stored) {
        const list: ApiBrakeReading[] = JSON.parse(stored);
        return assetId ? list.filter(b => b.assetId === assetId) : list;
      }
    }
    return [];
  }
}

export async function apiCreateBrakeReading(payload: Partial<ApiBrakeReading>): Promise<ApiBrakeReading> {
  try {
    return await apiFetch<ApiBrakeReading>('/brakes', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  } catch {
    const reading: ApiBrakeReading = {
      id: 'br-' + Date.now(),
      assetId: payload.assetId || '',
      axlePosition: payload.axlePosition || 'STEER_LEFT',
      brakeType: (payload.brakeType as any) || 'DRUM',
      liningThickness: Number(payload.liningThickness || 10),
      pushrodStroke: Number(payload.pushrodStroke || 1.5),
      drumCondition: (payload.drumCondition as any) || 'GOOD',
      brakeTemp: payload.brakeTemp ? Number(payload.brakeTemp) : undefined,
      recordedAt: new Date().toISOString(),
      recordedBy: payload.recordedBy || 'Inspector',
    };
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('fleet_store_brakeReadings');
      const list: ApiBrakeReading[] = stored ? JSON.parse(stored) : [];
      list.unshift(reading);
      localStorage.setItem('fleet_store_brakeReadings', JSON.stringify(list));
    }
    return reading;
  }
}

export async function apiDeleteBrakeReading(id: string): Promise<any> {
  try {
    return await apiFetch(`/brakes/${id}`, { method: 'DELETE' });
  } catch {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('fleet_store_brakeReadings');
      if (stored) {
        const list: ApiBrakeReading[] = JSON.parse(stored);
        localStorage.setItem('fleet_store_brakeReadings', JSON.stringify(list.filter(b => b.id !== id)));
      }
    }
    return { success: true };
  }
}

// ─── Expense Records ───────────────────────────────────────────────────────

export interface ApiExpenseRecord {
  id: string;
  assetId: string;
  category: string;
  amount: number;
  description: string;
  date: string;
  linkedWoId?: string | null;
}

export async function apiGetExpenses(assetId?: string): Promise<ApiExpenseRecord[]> {
  const query = assetId ? `?assetId=${encodeURIComponent(assetId)}` : '';
  return apiFetch<ApiExpenseRecord[]>(`/expenses${query}`);
}

export async function apiCreateExpense(payload: Partial<ApiExpenseRecord>): Promise<ApiExpenseRecord> {
  return apiFetch<ApiExpenseRecord>('/expenses', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function apiDeleteExpense(id: string): Promise<any> {
  return apiFetch(`/expenses/${id}`, { method: 'DELETE' });
}

// ─── Issues ────────────────────────────────────────────────────────────────

export interface ApiIssue {
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

export async function apiGetIssues(assetId?: string): Promise<ApiIssue[]> {
  const query = assetId ? `?assetId=${encodeURIComponent(assetId)}` : '';
  return apiFetch<ApiIssue[]>(`/issues${query}`);
}

export async function apiCreateIssue(payload: Partial<ApiIssue>): Promise<ApiIssue> {
  return apiFetch<ApiIssue>('/issues', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function apiUpdateIssue(id: string, payload: Partial<ApiIssue>): Promise<ApiIssue> {
  return apiFetch<ApiIssue>(`/issues/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function apiDeleteIssue(id: string): Promise<any> {
  return apiFetch(`/issues/${id}`, { method: 'DELETE' });
}

// ─── Contacts ──────────────────────────────────────────────────────────────

export interface ApiContact {
  id: string;
  userId?: string | null;
  name: string;
  role: string;
  phone: string;
  email: string;
  cdlNumber?: string | null;
  cdlExpiry?: string | null;
  medCardExpiry?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  avatarInitials: string;
}

export async function apiGetContacts(): Promise<ApiContact[]> {
  return apiFetch<ApiContact[]>('/contacts');
}

export async function apiCreateContact(payload: Partial<ApiContact>): Promise<ApiContact> {
  return apiFetch<ApiContact>('/contacts', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function apiUpdateContact(id: string, payload: Partial<ApiContact>): Promise<ApiContact> {
  return apiFetch<ApiContact>(`/contacts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function apiDeleteContact(id: string): Promise<any> {
  return apiFetch(`/contacts/${id}`, { method: 'DELETE' });
}

// ─── Places & Geofences ────────────────────────────────────────────────────

export interface ApiPlace {
  id: string;
  name: string;
  type: string;
  address: string;
  lat: number;
  lng: number;
  notes?: string;
}

export async function apiGetPlaces(): Promise<ApiPlace[]> {
  return apiFetch<ApiPlace[]>('/places');
}

export async function apiCreatePlace(payload: Partial<ApiPlace>): Promise<ApiPlace> {
  return apiFetch<ApiPlace>('/places', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function apiUpdatePlace(id: string, payload: Partial<ApiPlace>): Promise<ApiPlace> {
  return apiFetch<ApiPlace>(`/places/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function apiDeletePlace(id: string): Promise<any> {
  return apiFetch(`/places/${id}`, { method: 'DELETE' });
}

// ─── Fleet Documents ───────────────────────────────────────────────────────

export interface ApiDocument {
  id: string;
  assetId: string;
  name: string;
  type: string;
  fileUrl: string;
  uploadedBy: string;
  uploadedAt: string;
  expiresAt?: string | null;
}

export async function apiGetDocuments(assetId?: string): Promise<ApiDocument[]> {
  const query = assetId ? `?assetId=${encodeURIComponent(assetId)}` : '';
  return apiFetch<ApiDocument[]>(`/documents${query}`);
}

export async function apiCreateDocument(payload: Partial<ApiDocument>): Promise<ApiDocument> {
  return apiFetch<ApiDocument>('/documents', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function apiDeleteDocument(id: string): Promise<any> {
  return apiFetch(`/documents/${id}`, { method: 'DELETE' });
}

// ─── Warranties ────────────────────────────────────────────────────────────

export interface ApiWarranty {
  id: string;
  assetId: string;
  componentName: string;
  provider: string;
  warrantyNumber: string;
  startDate: string;
  expiryDate: string;
  coverageDetails: string;
  status: string;
}

export async function apiGetWarranties(assetId?: string): Promise<ApiWarranty[]> {
  const query = assetId ? `?assetId=${encodeURIComponent(assetId)}` : '';
  return apiFetch<ApiWarranty[]>(`/warranties${query}`);
}

export async function apiCreateWarranty(payload: Partial<ApiWarranty>): Promise<ApiWarranty> {
  return apiFetch<ApiWarranty>('/warranties', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function apiUpdateWarranty(id: string, payload: Partial<ApiWarranty>): Promise<ApiWarranty> {
  return apiFetch<ApiWarranty>(`/warranties/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function apiDeleteWarranty(id: string): Promise<any> {
  return apiFetch(`/warranties/${id}`, { method: 'DELETE' });
}

// ─── Replacement Analysis ──────────────────────────────────────────────────

export interface ApiReplacementAnalysis {
  id: string;
  assetId: string;
  purchasePrice: number;
  purchaseDate: string;
  lifetimeCostToDate: number;
  estimatedCurrentValue: number;
  recommendation: 'KEEP' | 'MONITOR' | 'REPLACE';
}

export async function apiGetReplacementAnalyses(): Promise<ApiReplacementAnalysis[]> {
  return apiFetch<ApiReplacementAnalysis[]>('/replacement');
}

export async function apiUpsertReplacementAnalysis(payload: Partial<ApiReplacementAnalysis>): Promise<ApiReplacementAnalysis> {
  return apiFetch<ApiReplacementAnalysis>('/replacement', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ─── Real Telematics & ELD Integrations ──────────────────────────────────────

export interface ApiLiveLocation {
  assetId: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  odometer?: number;
  updatedAt: string;
  source: string;
}

export async function apiRecordTelematicsPing(payload: {
  assetId: string;
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  odometer?: number;
  source?: string;
}): Promise<ApiLiveLocation> {
  return apiFetch<ApiLiveLocation>('/telematics/ping', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function apiGetLiveLocations(): Promise<ApiLiveLocation[]> {
  return apiFetch<ApiLiveLocation[]>('/telematics/live-locations');
}

export async function apiTestIntegration(payload: {
  provider: string;
  apiKey?: string;
  tenantId?: string;
}): Promise<{
  provider: string;
  status: string;
  latencyMs: number;
  message: string;
  verifiedAt: string;
}> {
  return apiFetch('/telematics/integrations/test', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ─── Compliance API ──────────────────────────────────────────────────────────

export async function apiGetComplianceDashboard(): Promise<any> {
  return apiFetch<any>('/compliance/dashboard');
}

export async function apiRequestPhoto(payload: {
  driverId: string;
  type: 'TIRE' | 'TRUCK_APPEARANCE';
  assetId: string;
}): Promise<any> {
  return apiFetch<any>('/compliance/photo-request', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function apiLogKYMiles(payload: {
  assetId: string;
  miles: number;
  date?: string;
}): Promise<any> {
  return apiFetch<any>('/compliance/ky-miles', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function apiGetPermits(): Promise<any[]> {
  return apiFetch<any[]>('/compliance/permits');
}
