'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  getTripDriverPositions,
  getDriverLocationHistory,
  getTripEta,
  getTripTrackingLogs,
  createTrackingLog,
  resolveTrackingLog,
  deleteTrackingLog,
  getSupertuckConfig,
  DriverPosition,
  LocationHistoryPoint,
  TrackingLog,
  EtaResponse,
} from '../lib/supertruck-api';
import {
  Navigation, RefreshCw, AlertTriangle, CheckCircle, Clock,
  MapPin, ChevronDown, ChevronUp, Plus, Trash2, Eye, Activity,
  Wifi, WifiOff, Route, X, Send, Shield,
} from 'lucide-react';

// ─── Mock data for demo mode (no API credentials) ────────────────────────────

const MOCK_TRIPS = [
  { id: 'trip-demo-001', label: 'Trip #1001 — Dallas → Houston', origin: { lat: 32.7767, lng: -96.797 }, dest: { lat: 29.7604, lng: -95.3698 } },
  { id: 'trip-demo-002', label: 'Trip #1002 — Austin → San Antonio', origin: { lat: 30.2672, lng: -97.7431 }, dest: { lat: 29.4241, lng: -98.4936 } },
];

const MOCK_DRIVERS: Record<string, { name: string; phone: string }> = {
  'driver-demo-001': { name: 'James Rodriguez', phone: '(214) 555-0192' },
  'driver-demo-002': { name: 'Maria Santos', phone: '(512) 555-0347' },
  'driver-demo-003': { name: 'Kevin Liu', phone: '(713) 555-0881' },
};

function generateMockPositions(tripId: string, tick: number): DriverPosition[] {
  const trip = MOCK_TRIPS.find(t => t.id === tripId);
  if (!trip) return [];

  const drivers = tripId === 'trip-demo-001'
    ? ['driver-demo-001', 'driver-demo-002']
    : ['driver-demo-003'];

  return drivers.map((driverId, i) => {
    const progress = ((tick * 0.003) + i * 0.2) % 1;
    const lat = trip.origin.lat + (trip.dest.lat - trip.origin.lat) * progress;
    const lng = trip.origin.lng + (trip.dest.lng - trip.origin.lng) * progress;
    const isStale = driverId === 'driver-demo-002';
    return {
      driverId,
      tripId,
      latitude: lat + (Math.random() - 0.5) * 0.005,
      longitude: lng + (Math.random() - 0.5) * 0.005,
      speed: isStale ? 0 : Math.round(55 + Math.random() * 15),
      heading: 180,
      recordedAt: new Date(Date.now() - (isStale ? 30 * 60000 : Math.random() * 120000)).toISOString(),
      isStale,
      minutesSinceLastPing: isStale ? 31 : Math.round(Math.random() * 3),
      nextStop: {
        address: trip.dest.lat > 30 ? '1200 Main St, Houston TX 77002' : '123 Commerce St, San Antonio TX 78201',
        appointmentTime: new Date(Date.now() + (2 - progress) * 3600000).toISOString(),
        distanceMiles: Math.round((1 - progress) * 240),
        etaMinutes: Math.round((1 - progress) * 190),
      },
      driver: { id: driverId, name: MOCK_DRIVERS[driverId].name, phone: MOCK_DRIVERS[driverId].phone },
    };
  });
}

const MOCK_LOGS: TrackingLog[] = [
  {
    id: 'log-001', tripId: 'trip-demo-001', issueType: 'DELAY',
    description: 'Traffic jam on I-45, ETA pushed by 45 minutes.',
    isResolved: false, brokerNotified: true, driverNotified: false,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'log-002', tripId: 'trip-demo-001', issueType: 'MECHANICAL',
    description: 'Low tire pressure warning on rear axle. Driver inspecting.',
    isResolved: true, brokerNotified: false, driverNotified: true,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    resolvedAt: new Date(Date.now() - 6000000).toISOString(),
  },
];

// ─── Issue type options ───────────────────────────────────────────────────────

const ISSUE_TYPES = [
  'DELAY', 'MECHANICAL', 'ACCIDENT', 'WEATHER', 'DETENTION',
  'LOAD_REFUSED', 'DRIVER_UNAVAILABLE', 'ROUTE_CHANGE', 'OTHER',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
function formatRelative(iso: string) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m ago`;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  isAdmin: boolean;
  currentDriverId?: string; // used when isAdmin=false (driver role)
}

export default function DriverTrackingMap({ isAdmin, currentDriverId }: Props) {
  const { tenantId, token } = getSupertuckConfig();
  const demoMode = !tenantId || !token;

  const [MapComponents, setMapComponents] = useState<any>(null);
  const [selectedTripId, setSelectedTripId] = useState<string>(MOCK_TRIPS[0].id);
  const [positions, setPositions] = useState<DriverPosition[]>([]);
  const [logs, setLogs] = useState<TrackingLog[]>([]);
  const [eta, setEta] = useState<EtaResponse | null>(null);
  const [routeHistory, setRouteHistory] = useState<LocationHistoryPoint[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [showReplay, setShowReplay] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(15);
  const [logsOpen, setLogsOpen] = useState(true);
  const [showCreateLog, setShowCreateLog] = useState(false);
  const [logIssueType, setLogIssueType] = useState('DELAY');
  const [logDesc, setLogDesc] = useState('');
  const [logBroker, setLogBroker] = useState(false);
  const [logDriver, setLogDriver] = useState(false);
  const [logSubmitting, setLogSubmitting] = useState(false);
  const [resolveId, setResolveId] = useState<string | null>(null);
  const [resolveNote, setResolveNote] = useState('');
  const [mapCenter, setMapCenter] = useState<[number, number]>([31.5, -96.5]);
  const [mapZoom] = useState(7);
  const tickRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // Load Leaflet dynamically
  useEffect(() => {
    Promise.all([import('leaflet'), import('react-leaflet')]).then(([L, RL]) => {
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });
      setMapComponents({ L, RL });
    });
  }, []);

  // Fetch positions + logs
  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      if (demoMode) {
        tickRef.current += 1;
        setPositions(generateMockPositions(selectedTripId, tickRef.current));
        const demoLogs = MOCK_LOGS.filter(l => l.tripId === selectedTripId);
        setLogs(demoLogs);
        setEta({ tripId: selectedTripId, etaMinutes: 112, estimatedArrival: new Date(Date.now() + 112 * 60000).toISOString(), distanceMiles: 195 });
      } else {
        const [pos, tripLogs] = await Promise.all([
          getTripDriverPositions(selectedTripId),
          getTripTrackingLogs(selectedTripId),
        ]);
        setPositions(pos);
        setLogs(tripLogs);
        try {
          const etaData = await getTripEta(selectedTripId);
          setEta(etaData);
        } catch { /* ETA is optional */ }
      }
    } catch (e: any) {
      setError(e.message ?? 'Failed to fetch driver positions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedTripId, demoMode]);

  // Initial load
  useEffect(() => {
    fetchData(false);
  }, [fetchData]);

  // Auto-refresh every 15 seconds
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);

    setCountdown(15);
    intervalRef.current = setInterval(() => {
      fetchData(true);
      setCountdown(15);
    }, 15000);

    countdownRef.current = setInterval(() => {
      setCountdown(c => (c > 0 ? c - 1 : 0));
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [fetchData]);

  // Route history fetch
  const loadRouteHistory = async (driverId: string) => {
    setSelectedDriverId(driverId);
    setShowReplay(true);
    try {
      if (demoMode) {
        const trip = MOCK_TRIPS.find(t => t.id === selectedTripId)!;
        const pts: LocationHistoryPoint[] = Array.from({ length: 30 }, (_, i) => {
          const p = i / 29;
          return {
            latitude: trip.origin.lat + (trip.dest.lat - trip.origin.lat) * p,
            longitude: trip.origin.lng + (trip.dest.lng - trip.origin.lng) * p,
            speed: Math.round(55 + Math.random() * 15),
            recordedAt: new Date(Date.now() - (30 - i) * 120000).toISOString(),
          };
        });
        setRouteHistory(pts);
      } else {
        const hist = await getDriverLocationHistory(driverId, selectedTripId);
        setRouteHistory(hist);
      }
    } catch (e: any) {
      setError('Could not load route history: ' + e.message);
    }
  };

  const clearReplay = () => { setShowReplay(false); setRouteHistory([]); setSelectedDriverId(null); };

  // Focus map on driver
  const focusDriver = (pos: DriverPosition) => {
    setMapCenter([pos.latitude, pos.longitude]);
  };

  // Create log
  const handleCreateLog = async (e: React.FormEvent) => {
    e.preventDefault();
    setLogSubmitting(true);
    try {
      if (demoMode) {
        const fake: TrackingLog = {
          id: 'log-' + Math.random().toString(36).substr(2, 6),
          tripId: selectedTripId, issueType: logIssueType, description: logDesc,
          isResolved: false, brokerNotified: logBroker, driverNotified: logDriver,
          createdAt: new Date().toISOString(),
        };
        setLogs(prev => [fake, ...prev]);
      } else {
        const created = await createTrackingLog({
          tripId: selectedTripId, issueType: logIssueType, description: logDesc,
          brokerNotified: logBroker, driverNotified: logDriver,
        });
        setLogs(prev => [created, ...prev]);
      }
      setLogDesc(''); setLogIssueType('DELAY'); setLogBroker(false); setLogDriver(false);
      setShowCreateLog(false);
    } catch (e: any) {
      setError('Failed to create log: ' + e.message);
    } finally {
      setLogSubmitting(false);
    }
  };

  // Resolve log
  const handleResolve = async (id: string) => {
    try {
      if (demoMode) {
        setLogs(prev => prev.map(l => l.id === id ? { ...l, isResolved: true, resolvedAt: new Date().toISOString() } : l));
      } else {
        await resolveTrackingLog(id, { isResolved: true, brokerNotified: true, driverNotified: true });
        await fetchData(true);
      }
      setResolveId(null);
    } catch (e: any) { setError('Failed to resolve: ' + e.message); }
  };

  // Delete log
  const handleDeleteLog = async (id: string) => {
    try {
      if (!demoMode) await deleteTrackingLog(id);
      setLogs(prev => prev.filter(l => l.id !== id));
    } catch (e: any) { setError('Failed to delete: ' + e.message); }
  };

  const openLogs = logs.filter(l => !l.isResolved);
  const resolvedLogs = logs.filter(l => l.isResolved);

  // ─── Render ────────────────────────────────────────────────────────────────

  if (!MapComponents) {
    return (
      <div className="flex items-center justify-center h-96 bg-slate-900 rounded-2xl border border-slate-700">
        <div className="text-center space-y-3">
          <div style={{ width: 40, height: 40, border: '3px solid #6366f1', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
          <p className="text-slate-400 text-sm font-medium">Initializing Live Tracking...</p>
        </div>
      </div>
    );
  }

  const { L, RL } = MapComponents;
  const { MapContainer, TileLayer, CircleMarker, Marker, Popup, Tooltip, Polyline, useMap } = RL;

  function MapFlyTo({ center }: { center: [number, number] }) {
    const map = useMap();
    useEffect(() => { map.flyTo(center, 11, { duration: 1.2 }); }, [center, map]);
    return null;
  }

  const getDriverIcon = (pos: DriverPosition) => {
    const color = pos.isStale ? '#64748b' : '#22c55e';
    const pulse = pos.isStale ? '' : `
      <style>
        @keyframes dtPulse {
          0%,100%{transform:scale(1);opacity:0.8}
          50%{transform:scale(1.6);opacity:0}
        }
      </style>
      <div style="position:absolute;inset:-8px;border-radius:50%;background:${color};opacity:0.3;animation:dtPulse 1.8s ease-out infinite"></div>
    `;
    return L.divIcon({
      className: '',
      html: `<div style="position:relative;width:36px;height:36px">
        ${pulse}
        <div style="position:absolute;inset:0;background:${color};border-radius:50%;border:3px solid #fff;box-shadow:0 2px 12px ${color}88;display:flex;align-items:center;justify-content:center;font-size:16px">🚛</div>
      </div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });
  };

  return (
    <div style={{ display: 'flex', gap: 16, height: 680, fontFamily: 'inherit' }}>

      {/* ── Left: Map ────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Top controls bar */}
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 14, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {/* Trip selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <MapPin size={14} color="#818cf8" />
            <select
              value={selectedTripId}
              onChange={e => { setSelectedTripId(e.target.value); clearReplay(); }}
              style={{ background: '#0f172a', border: '1px solid #475569', borderRadius: 8, padding: '4px 10px', fontSize: 12, color: '#e2e8f0', outline: 'none', cursor: 'pointer' }}
            >
              {MOCK_TRIPS.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </div>

          {/* ETA badge */}
          {eta && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#1e3a5f', border: '1px solid #3b82f6', borderRadius: 8, padding: '3px 10px' }}>
              <Clock size={12} color="#60a5fa" />
              <span style={{ fontSize: 11, color: '#93c5fd', fontWeight: 700 }}>
                ETA: {eta.etaMinutes ? `${Math.round(eta.etaMinutes / 60)}h ${eta.etaMinutes % 60}m` : '—'}
              </span>
              {eta.distanceMiles && (
                <span style={{ fontSize: 11, color: '#64748b' }}>· {eta.distanceMiles} mi</span>
              )}
            </div>
          )}

          {/* Live indicator */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            {demoMode ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#7c3aed22', border: '1px solid #7c3aed', borderRadius: 8, padding: '3px 8px' }}>
                <Activity size={10} color="#a78bfa" />
                <span style={{ fontSize: 10, color: '#a78bfa', fontWeight: 700 }}>DEMO MODE</span>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#16a34a22', border: '1px solid #16a34a', borderRadius: 8, padding: '3px 8px' }}>
                <Wifi size={10} color="#4ade80" />
                <span style={{ fontSize: 10, color: '#4ade80', fontWeight: 700 }}>LIVE</span>
              </div>
            )}

            {/* Countdown arc */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>Refresh in {countdown}s</div>
              <button
                onClick={() => fetchData(true)}
                disabled={refreshing}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, color: '#6366f1', display: 'flex', alignItems: 'center' }}
                title="Refresh now"
              >
                <RefreshCw size={14} style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }} />
              </button>
            </div>

            {/* Route replay control */}
            {showReplay && (
              <button
                onClick={clearReplay}
                style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#dc262622', border: '1px solid #dc2626', borderRadius: 8, padding: '3px 8px', fontSize: 11, color: '#f87171', cursor: 'pointer' }}
              >
                <X size={10} /> Clear Replay
              </button>
            )}
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div style={{ background: '#7f1d1d33', border: '1px solid #dc2626', borderRadius: 10, padding: '8px 14px', fontSize: 12, color: '#fca5a5', display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={14} /> {error}
            <button onClick={() => setError(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#fca5a5' }}><X size={12} /></button>
          </div>
        )}

        {/* Refresh progress bar */}
        <div style={{ height: 3, background: '#1e293b', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ height: '100%', background: 'linear-gradient(90deg,#6366f1,#8b5cf6)', width: `${((15 - countdown) / 15) * 100}%`, transition: 'width 1s linear', borderRadius: 4 }} />
        </div>

        {/* MAP */}
        <div style={{ flex: 1, borderRadius: 16, overflow: 'hidden', border: '1px solid #334155' }}>
          {loading ? (
            <div style={{ height: '100%', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center', color: '#64748b' }}>
                <Navigation size={32} style={{ margin: '0 auto 8px', animation: 'spin 1s linear infinite' }} />
                <p style={{ fontSize: 13 }}>Loading driver positions…</p>
              </div>
            </div>
          ) : (
            <MapContainer
              center={mapCenter}
              zoom={mapZoom}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
                attribution='© Google Maps'
              />
              <MapFlyTo center={mapCenter} />

              {/* Driver markers */}
              {positions.map(pos => (
                <Marker
                  key={pos.driverId}
                  position={[pos.latitude, pos.longitude]}
                  icon={getDriverIcon(pos)}
                  eventHandlers={{ click: () => focusDriver(pos) }}
                >
                  <Popup maxWidth={260}>
                    <div style={{ fontFamily: 'sans-serif', padding: 4 }}>
                      <div style={{ fontWeight: 800, fontSize: 14, color: '#0f172a', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ background: pos.isStale ? '#64748b' : '#16a34a', color: '#fff', borderRadius: 6, padding: '1px 7px', fontSize: 10 }}>
                          {pos.isStale ? '⚠ STALE' : '● LIVE'}
                        </span>
                        {pos.driver?.name ?? pos.driverId}
                      </div>
                      {pos.driver?.phone && <div style={{ fontSize: 11, color: '#475569' }}>📞 {pos.driver.phone}</div>}
                      <div style={{ fontSize: 11, color: '#475569', marginTop: 4 }}>
                        Last ping: <b>{formatRelative(pos.recordedAt)}</b> ({formatTime(pos.recordedAt)})
                      </div>
                      {pos.speed != null && <div style={{ fontSize: 11, color: '#475569' }}>Speed: <b>{pos.speed} mph</b></div>}
                      {pos.nextStop && (
                        <div style={{ marginTop: 6, background: '#f0f9ff', borderRadius: 6, padding: '6px 8px' }}>
                          <div style={{ fontSize: 10, color: '#0284c7', fontWeight: 700 }}>NEXT STOP</div>
                          <div style={{ fontSize: 11, color: '#0f172a' }}>{pos.nextStop.address}</div>
                          {pos.nextStop.distanceMiles != null && (
                            <div style={{ fontSize: 10, color: '#475569' }}>{pos.nextStop.distanceMiles} mi · ETA {pos.nextStop.etaMinutes} min</div>
                          )}
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                        <button
                          onClick={() => loadRouteHistory(pos.driverId)}
                          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, background: '#6366f1', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 8px', fontSize: 11, cursor: 'pointer', fontWeight: 700 }}
                        >
                          <Route size={11} /> Replay Route
                        </button>
                      </div>
                    </div>
                  </Popup>
                  <Tooltip direction="top" offset={[0, -22]} opacity={0.95} permanent={false}>
                    <span style={{ fontSize: 11, fontWeight: 700 }}>{pos.driver?.name ?? pos.driverId}</span>
                  </Tooltip>
                </Marker>
              ))}

              {/* Route history polyline */}
              {showReplay && routeHistory.length > 1 && (
                <Polyline
                  positions={routeHistory.map(p => [p.latitude, p.longitude])}
                  pathOptions={{ color: '#8b5cf6', weight: 3, opacity: 0.85, dashArray: '6,4' }}
                />
              )}

              {/* History dots */}
              {showReplay && routeHistory.map((pt, i) => (
                <CircleMarker
                  key={i}
                  center={[pt.latitude, pt.longitude]}
                  radius={4}
                  pathOptions={{ color: '#8b5cf6', fillColor: '#8b5cf6', fillOpacity: 0.7, weight: 1 }}
                >
                  <Tooltip direction="top">
                    <span style={{ fontSize: 10 }}>{formatTime(pt.recordedAt)} · {pt.speed ?? '?'} mph</span>
                  </Tooltip>
                </CircleMarker>
              ))}
            </MapContainer>
          )}
        </div>

        {/* Driver grid below map */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
          {positions.map(pos => (
            <div
              key={pos.driverId}
              onClick={() => focusDriver(pos)}
              style={{
                background: '#1e293b', border: `1px solid ${pos.isStale ? '#475569' : '#22c55e44'}`,
                borderRadius: 12, padding: '10px 14px', cursor: 'pointer', transition: 'all 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#6366f1')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = pos.isStale ? '#475569' : '#22c55e44')}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>{pos.driver?.name ?? pos.driverId.slice(0, 8)}</span>
                <span style={{
                  fontSize: 9, fontWeight: 800, padding: '1px 6px', borderRadius: 6,
                  background: pos.isStale ? '#47556920' : '#16a34a20',
                  color: pos.isStale ? '#94a3b8' : '#4ade80',
                  border: `1px solid ${pos.isStale ? '#47556950' : '#4ade8050'}`,
                }}>
                  {pos.isStale ? 'STALE' : 'LIVE'}
                </span>
              </div>
              <div style={{ fontSize: 11, color: '#64748b' }}>
                Last ping: {pos.minutesSinceLastPing < 1 ? '< 1 min' : `${pos.minutesSinceLastPing}m ago`}
              </div>
              {pos.speed != null && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>🚗 {pos.speed} mph</div>}
              <button
                onClick={e => { e.stopPropagation(); loadRouteHistory(pos.driverId); }}
                style={{ marginTop: 8, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, background: '#6366f120', border: '1px solid #6366f150', borderRadius: 7, padding: '4px 0', fontSize: 11, color: '#a5b4fc', cursor: 'pointer' }}
              >
                <Route size={11} /> View Route
              </button>
            </div>
          ))}
          {positions.length === 0 && !loading && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', color: '#475569', padding: '20px 0', fontSize: 13 }}>
              No driver positions found for this trip.
            </div>
          )}
        </div>
      </div>

      {/* ── Right: Tracking Logs Panel ────────────────────────────────────── */}
      <div style={{ width: 340, display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto' }}>

        {/* Logs header */}
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 14, padding: '12px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={15} color="#f59e0b" />
              <span style={{ fontSize: 14, fontWeight: 800, color: '#e2e8f0' }}>Tracking Logs</span>
              {openLogs.length > 0 && (
                <span style={{ background: '#dc2626', color: '#fff', borderRadius: 20, padding: '0 6px', fontSize: 10, fontWeight: 800 }}>{openLogs.length}</span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={() => setShowCreateLog(v => !v)}
                style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#6366f1', border: 'none', borderRadius: 7, padding: '5px 10px', fontSize: 11, color: '#fff', cursor: 'pointer', fontWeight: 700 }}
              >
                <Plus size={12} /> New Log
              </button>
              <button
                onClick={() => setLogsOpen(v => !v)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                {logsOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>
          </div>

          {/* Create log form */}
          {showCreateLog && (
            <form onSubmit={handleCreateLog} style={{ background: '#0f172a', borderRadius: 10, padding: 12, marginBottom: 8, border: '1px solid #334155' }}>
              <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Create Tracking Issue</div>
              <select
                value={logIssueType}
                onChange={e => setLogIssueType(e.target.value)}
                style={{ width: '100%', background: '#1e293b', border: '1px solid #475569', borderRadius: 7, padding: '6px 10px', fontSize: 12, color: '#e2e8f0', marginBottom: 8, outline: 'none' }}
              >
                {ISSUE_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
              <textarea
                value={logDesc}
                onChange={e => setLogDesc(e.target.value)}
                required
                placeholder="Describe the issue…"
                rows={3}
                style={{ width: '100%', background: '#1e293b', border: '1px solid #475569', borderRadius: 7, padding: '6px 10px', fontSize: 12, color: '#e2e8f0', resize: 'vertical', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
              />
              <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 12, color: '#94a3b8' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                  <input type="checkbox" checked={logBroker} onChange={e => setLogBroker(e.target.checked)} /> Notify Broker
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                  <input type="checkbox" checked={logDriver} onChange={e => setLogDriver(e.target.checked)} /> Notify Driver
                </label>
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                <button
                  type="submit"
                  disabled={logSubmitting}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, background: '#6366f1', border: 'none', borderRadius: 7, padding: '7px 0', fontSize: 12, color: '#fff', cursor: 'pointer', fontWeight: 700 }}
                >
                  <Send size={12} /> {logSubmitting ? 'Saving…' : 'Submit Log'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateLog(false)}
                  style={{ background: '#334155', border: 'none', borderRadius: 7, padding: '7px 12px', fontSize: 12, color: '#94a3b8', cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Open logs */}
          {logsOpen && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {openLogs.length === 0 && (
                <div style={{ textAlign: 'center', color: '#475569', fontSize: 12, padding: '12px 0' }}>
                  <CheckCircle size={20} color="#22c55e" style={{ margin: '0 auto 6px' }} />
                  No open issues for this trip.
                </div>
              )}
              {openLogs.map(log => (
                <div key={log.id} style={{ background: '#0f172a', borderRadius: 10, padding: 12, border: '1px solid #dc262640' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 10, fontWeight: 800, background: '#dc262622', color: '#f87171', borderRadius: 5, padding: '1px 7px', border: '1px solid #dc262640' }}>
                      {log.issueType}
                    </span>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {log.brokerNotified && <span title="Broker notified" style={{ fontSize: 9, color: '#60a5fa' }}>✉️B</span>}
                      {log.driverNotified && <span title="Driver notified" style={{ fontSize: 9, color: '#4ade80' }}>✉️D</span>}
                      <button onClick={() => handleDeleteLog(log.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 0 }}><Trash2 size={12} /></button>
                    </div>
                  </div>
                  <p style={{ fontSize: 12, color: '#cbd5e1', margin: '4px 0 6px' }}>{log.description}</p>
                  <div style={{ fontSize: 10, color: '#475569' }}>{formatRelative(log.createdAt)}</div>
                  {resolveId === log.id ? (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => handleResolve(log.id)}
                          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, background: '#16a34a', border: 'none', borderRadius: 7, padding: '5px 0', fontSize: 11, color: '#fff', cursor: 'pointer', fontWeight: 700 }}
                        >
                          <CheckCircle size={11} /> Confirm Resolve
                        </button>
                        <button onClick={() => setResolveId(null)} style={{ background: '#334155', border: 'none', borderRadius: 7, padding: '5px 10px', fontSize: 11, color: '#94a3b8', cursor: 'pointer' }}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setResolveId(log.id)}
                      style={{ marginTop: 8, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, background: '#16a34a20', border: '1px solid #16a34a50', borderRadius: 7, padding: '5px 0', fontSize: 11, color: '#4ade80', cursor: 'pointer' }}
                    >
                      <Shield size={11} /> Mark Resolved
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Resolved logs (collapsed) */}
        {resolvedLogs.length > 0 && (
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 14, padding: '10px 14px' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <CheckCircle size={13} color="#4ade80" /> Resolved ({resolvedLogs.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {resolvedLogs.map(log => (
                <div key={log.id} style={{ background: '#0f172a', borderRadius: 8, padding: '8px 10px', border: '1px solid #22c55e20' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 10, color: '#4ade80', fontWeight: 700 }}>{log.issueType}</span>
                    <span style={{ fontSize: 10, color: '#475569' }}>{formatRelative(log.resolvedAt ?? log.createdAt)}</span>
                  </div>
                  <p style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>{log.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Legend */}
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 14, padding: '10px 14px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Legend</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#94a3b8' }}>
              <span style={{ width: 12, height: 12, background: '#22c55e', borderRadius: '50%', display: 'inline-block', boxShadow: '0 0 6px #22c55e' }} />
              Live driver (ping &lt; 25 min)
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#94a3b8' }}>
              <span style={{ width: 12, height: 12, background: '#64748b', borderRadius: '50%', display: 'inline-block' }} />
              Stale driver (ping &gt; 25 min)
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#94a3b8' }}>
              <span style={{ width: 12, height: 4, background: '#8b5cf6', borderRadius: 2, display: 'inline-block' }} />
              Route history replay
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
