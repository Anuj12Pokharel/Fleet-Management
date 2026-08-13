/**
 * Supertruck AI — Typed API Client
 * Base: https://api.staging.supertruck.ai/api/v1
 *
 * Covers:
 *  • Driver Tracking  (/driver-track/*)
 *  • Tracking Logs    (/tracking-log/*)
 */

export const SUPERTRUCK_BASE = 'https://api.staging.supertruck.ai/api/v1';

// ─── Config helpers ─────────────────────────────────────────────────────────

export function getSupertuckConfig(): { tenantId: string; token: string } {
  return {
    tenantId: typeof window !== 'undefined' ? localStorage.getItem('st_tenant_id') ?? '' : '',
    token: typeof window !== 'undefined' ? localStorage.getItem('st_token') ?? '' : '',
  };
}

export function saveSupertuckConfig(tenantId: string, token: string) {
  localStorage.setItem('st_tenant_id', tenantId);
  localStorage.setItem('st_token', token);
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DriverPosition {
  driverId: string;
  tripId: string;
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  accuracy?: number;
  recordedAt: string;
  isStale: boolean;
  minutesSinceLastPing: number;
  nextStop?: {
    address: string;
    appointmentTime?: string;
    distanceMiles?: number;
    etaMinutes?: number;
  } | null;
  driver?: {
    id: string;
    name: string;
    phone?: string;
  };
}

export interface LocationHistoryPoint {
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  recordedAt: string;
}

export interface EtaResponse {
  tripId: string;
  etaMinutes?: number;
  estimatedArrival?: string;
  distanceMiles?: number;
}

export interface TrackingLog {
  id: string;
  tripId: string;
  issueType: string;
  description: string;
  isResolved: boolean;
  brokerNotified: boolean;
  driverNotified: boolean;
  stopId?: string | null;
  revisedAppointmentTime?: string | null;
  createdAt: string;
  resolvedAt?: string | null;
  stopSnapshot?: { originalStopDate?: string } | null;
}

export interface CreateTrackingLogDto {
  tripId: string;
  issueType: string;
  description: string;
  brokerNotified?: boolean;
  driverNotified?: boolean;
  stopId?: string;
  revisedAppointmentTime?: string;
}

export interface ResolveTrackingLogDto {
  isResolved?: boolean;
  appointmentChanged?: boolean;
  revisedAppointmentTime?: string;
  stopId?: string;
  isDriverFault?: boolean;
  chargeAmount?: number;
  chargeName?: string;
  brokerNotified?: boolean;
  driverNotified?: boolean;
}

// ─── Core fetch helper ────────────────────────────────────────────────────────

async function stFetch<T>(
  path: string,
  options: RequestInit = {},
  tenantId?: string,
  token?: string
): Promise<T> {
  const cfg = getSupertuckConfig();
  const tid = tenantId ?? cfg.tenantId;
  const tok = token ?? cfg.token;

  const res = await fetch(`${SUPERTRUCK_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-tenant-id': tid,
      ...(tok ? { Authorization: `Bearer ${tok}` } : {}),
      ...(options.headers ?? {}),
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Supertruck API ${res.status}: ${text || res.statusText}`);
  }

  // 204 No Content
  if (res.status === 204) return undefined as unknown as T;

  return res.json() as Promise<T>;
}

// ─── Driver Tracking ─────────────────────────────────────────────────────────

/**
 * Record a driver GPS ping (called by driver device).
 */
export async function recordDriverLocation(payload: {
  driverId: string;
  tripId: string;
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  accuracy?: number;
}) {
  return stFetch<{ message: string }>('/driver-track/location', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Get the latest position for a single driver on a trip.
 * Includes isStale, minutesSinceLastPing, nextStop, ETA.
 */
export async function getDriverLatestPosition(
  driverId: string,
  tripId: string
): Promise<DriverPosition> {
  return stFetch<DriverPosition>(
    `/driver-track/position/${driverId}?tripId=${encodeURIComponent(tripId)}`
  );
}

/**
 * Get the latest position for ALL drivers on a trip (live map pins).
 */
export async function getTripDriverPositions(
  tripId: string,
  driverId?: string
): Promise<DriverPosition[]> {
  const qs = driverId ? `?driverId=${encodeURIComponent(driverId)}` : '';
  return stFetch<DriverPosition[]>(`/driver-track/trip/${tripId}/positions${qs}`);
}

/**
 * Get ordered location history for a driver on a trip (route replay).
 */
export async function getDriverLocationHistory(
  driverId: string,
  tripId: string
): Promise<LocationHistoryPoint[]> {
  return stFetch<LocationHistoryPoint[]>(`/driver-track/history/${driverId}/${tripId}`);
}

/**
 * Get ETA for a trip.
 */
export async function getTripEta(tripId: string): Promise<EtaResponse> {
  return stFetch<EtaResponse>(`/driver-track/eta/${tripId}`);
}

// ─── Tracking Logs ───────────────────────────────────────────────────────────

/**
 * Create a new tracking issue log for a trip.
 */
export async function createTrackingLog(dto: CreateTrackingLogDto): Promise<TrackingLog> {
  return stFetch<TrackingLog>('/tracking-log', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

/**
 * Get all tracking logs for a trip (newest first).
 */
export async function getTripTrackingLogs(tripId: string): Promise<TrackingLog[]> {
  return stFetch<TrackingLog[]>(`/tracking-log/trip/${tripId}`);
}

/**
 * Get a single tracking log by ID.
 */
export async function getTrackingLog(id: string): Promise<TrackingLog> {
  return stFetch<TrackingLog>(`/tracking-log/${id}`);
}

/**
 * Resolve / update a tracking log (with optional side-effects).
 */
export async function resolveTrackingLog(
  id: string,
  dto: ResolveTrackingLogDto
): Promise<TrackingLog> {
  return stFetch<TrackingLog>(`/tracking-log/${id}/resolve`, {
    method: 'PATCH',
    body: JSON.stringify(dto),
  });
}

/**
 * Delete a tracking log.
 */
export async function deleteTrackingLog(id: string): Promise<void> {
  return stFetch<void>(`/tracking-log/${id}`, { method: 'DELETE' });
}
