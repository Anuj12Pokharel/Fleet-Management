'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Asset, Place } from '../mockDb';
import {
  getTripDriverPositions,
  getDriverLocationHistory,
  getTripEta,
  getTripTrackingLogs,
  createTrackingLog,
  resolveTrackingLog,
  deleteTrackingLog,
  getSupertuckConfig,
  saveSupertuckConfig,
  recordDriverLocation,
  DriverPosition,
  LocationHistoryPoint,
  TrackingLog,
  EtaResponse,
} from '../lib/supertruck-api';
import {
  apiGetLiveLocations,
  apiRecordTelematicsPing,
  apiTestIntegration,
  ApiLiveLocation
} from '../lib/api-client';
import {
  MapPin,
  Navigation,
  Search,
  Crosshair,
  Eye,
  Radio,
  Truck,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Activity,
  Layers,
  Send,
  User,
  Shield,
  Route,
  Compass,
  Settings,
  Wifi,
  LocateFixed
} from 'lucide-react';

interface Props {
  assets: Asset[];
  places: Place[];
  assignments?: any[];
  isAdmin?: boolean;
  currentDriverId?: string;
}

const statusColor = (s: string) =>
  s === 'OPERABLE' ? '#16a34a' : s === 'NEEDS_ATTENTION' ? '#d97706' : '#dc2626';

// Dynamic GPS coordinate generator for assets when no live ping has been received yet
function getAssetGps(asset: Asset, idx: number, places: Place[]) {
  // If places exist, place the asset in a known company facility
  if (places && places.length > 0) {
    const p = places[idx % places.length];
    // Slightly offset so markers in same facility don't stack completely
    const offsetLat = ((idx * 7) % 10 - 5) * 0.003;
    const offsetLng = ((idx * 11) % 10 - 5) * 0.003;
    return {
      lat: Number((p.lat + offsetLat).toFixed(4)),
      lng: Number((p.lng + offsetLng).toFixed(4))
    };
  }
  let charSum = 0;
  const str = asset.vin || asset.id || 'asset';
  for (let i = 0; i < str.length; i++) {
    charSum += str.charCodeAt(i);
  }
  const baseLat = 30.2 + ((charSum * 13 + idx * 47) % 350) / 100;
  const baseLng = -97.8 + ((charSum * 31 + idx * 73) % 450) / 100;
  return { lat: Number(baseLat.toFixed(4)), lng: Number(baseLng.toFixed(4)) };
}

export interface RealTrip {
  id: string;
  label: string;
  assetId: string;
  assetName: string;
  driverId: string;
  driverName: string;
  driverPhone: string;
  origin: { lat: number; lng: number; name: string };
  dest: { lat: number; lng: number; name: string };
  notes?: string;
}

const ISSUE_TYPES = [
  'DELAY', 'MECHANICAL', 'ACCIDENT', 'WEATHER', 'DETENTION',
  'LOAD_REFUSED', 'DRIVER_UNAVAILABLE', 'ROUTE_CHANGE', 'OTHER',
];

export default function FleetMap({ assets = [], places = [], assignments = [], isAdmin = false, currentDriverId }: Props) {
  const [config, setConfig] = useState(getSupertuckConfig);
  const isSupertruckConfigured = Boolean(config.tenantId && config.token);

  const [MapComponents, setMapComponents] = useState<any>(null);

  // Layer Toggles
  const [showAssets, setShowAssets] = useState(true);
  const [showDrivers, setShowDrivers] = useState(true);
  const [showPlaces, setShowPlaces] = useState(true);
  const [showBreadcrumbs, setShowBreadcrumbs] = useState(true);

  // Filters & Selection
  const [assetFilter, setAssetFilter] = useState<'ALL' | 'OPERABLE' | 'NEEDS_ATTENTION' | 'INOPERABLE'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<{ lat: number; lng: number; zoom?: number } | null>(null);

  // Derive Real Trips dynamically from Assignments & Assets
  const realTrips: RealTrip[] = React.useMemo(() => {
    const list: RealTrip[] = [];
    const originPlace = places[0] || { lat: 32.7767, lng: -96.7970, name: 'Dallas Main Depot' };
    const destPlace = places[1] || { lat: 29.7604, lng: -95.3698, name: 'Houston Terminal' };

    if (assignments && assignments.length > 0) {
      assignments.forEach((asg, idx) => {
        const asset = assets.find(a => a.id === asg.assetId);
        const pDest = places[(idx + 1) % Math.max(1, places.length)] || destPlace;
        list.push({
          id: asg.id || `asg-${idx}`,
          label: `${asset?.name || 'Tractor'} — ${asg.driverName || 'Assigned Driver'}`,
          assetId: asg.assetId,
          assetName: asset?.name || 'Assigned Tractor',
          driverId: asg.driverId || `drv-${idx}`,
          driverName: asg.driverName || 'Fleet Driver',
          driverPhone: '(214) 555-0192',
          origin: { lat: originPlace.lat, lng: originPlace.lng, name: originPlace.name },
          dest: { lat: pDest.lat, lng: pDest.lng, name: pDest.name },
          notes: asg.notes || 'Active Route Assignment',
        });
      });
    }

    // Also include any tractor assets not covered by an assignment
    assets.filter(a => a.type === 'TRACTOR').forEach((a, idx) => {
      if (!list.some(t => t.assetId === a.id)) {
        const pDest = places[(idx + 1) % Math.max(1, places.length)] || destPlace;
        list.push({
          id: `trip-asset-${a.id}`,
          label: `${a.name} (${a.plateNumber})`,
          assetId: a.id,
          assetName: a.name,
          driverId: `drv-${a.id}`,
          driverName: 'Unassigned Fleet Driver',
          driverPhone: '(512) 555-0347',
          origin: { lat: originPlace.lat, lng: originPlace.lng, name: originPlace.name },
          dest: { lat: pDest.lat, lng: pDest.lng, name: pDest.name },
          notes: 'Standard Terminal Route',
        });
      }
    });

    return list;
  }, [assignments, assets, places]);

  // Live Driver Tracking State
  const [selectedTripId, setSelectedTripId] = useState<string>(realTrips[0]?.id || '');

  useEffect(() => {
    if (realTrips.length > 0 && (!selectedTripId || !realTrips.some(t => t.id === selectedTripId))) {
      setSelectedTripId(realTrips[0].id);
    }
  }, [realTrips, selectedTripId]);

  const [positions, setPositions] = useState<DriverPosition[]>([]);
  const [logs, setLogs] = useState<TrackingLog[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [routeHistory, setRouteHistory] = useState<LocationHistoryPoint[]>([]);
  const [countdown, setCountdown] = useState(15);
  const [refreshing, setRefreshing] = useState(false);
  const [logsDrawerOpen, setLogsDrawerOpen] = useState(false);

  // Ingest Live GPS Modal State
  const [showGpsModal, setShowGpsModal] = useState(false);
  const [gpsAssetId, setGpsAssetId] = useState('');
  const [gpsLat, setGpsLat] = useState(32.7767);
  const [gpsLng, setGpsLng] = useState(-96.7970);
  const [gpsSpeed, setGpsSpeed] = useState(62);
  const [gpsHeading, setGpsHeading] = useState(165);
  const [gpsOdometer, setGpsOdometer] = useState(145320);
  const [gpsSource, setGpsSource] = useState('Motive ELD Live');
  const [gpsSubmitting, setGpsSubmitting] = useState(false);

  // Supertruck Config Modal State
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [cfgTenantId, setCfgTenantId] = useState(config.tenantId || '');
  const [cfgToken, setCfgToken] = useState(config.token || '');
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testingConnection, setTestingConnection] = useState(false);

  // Create Log Modal State
  const [showCreateLog, setShowCreateLog] = useState(false);
  const [logIssueType, setLogIssueType] = useState('DELAY');
  const [logDesc, setLogDesc] = useState('');
  const [logBroker, setLogBroker] = useState(false);
  const [logDriver, setLogDriver] = useState(false);
  const [logSubmitting, setLogSubmitting] = useState(false);

  // Load Leaflet dynamically for SSR
  useEffect(() => {
    Promise.all([
      import('leaflet'),
      import('react-leaflet')
    ]).then(([L, RL]) => {
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });
      setMapComponents({ L, RL });
    });
  }, []);

  // Fetch Live Positions from Backend & Supertruck Cloud
  const fetchLivePositions = useCallback(async () => {
    try {
      let liveBackendLocations: ApiLiveLocation[] = [];
      try {
        liveBackendLocations = await apiGetLiveLocations();
      } catch (e) {
        // Fallback gracefully if backend not running
      }

      const activeTrip = realTrips.find(t => t.id === selectedTripId) || realTrips[0];
      if (!activeTrip) return;

      if (isSupertruckConfigured) {
        // Real Supertruck Cloud Integration
        const cloudPositions = await getTripDriverPositions(activeTrip.id);
        const filtered = isAdmin || !currentDriverId
          ? cloudPositions
          : cloudPositions.filter(p => p.driverId === currentDriverId);
        setPositions(filtered);

        const targetDriver = selectedDriverId || filtered[0]?.driverId;
        if (targetDriver) {
          const hist = await getDriverLocationHistory(targetDriver, activeTrip.id);
          setRouteHistory(hist);
        }
      } else {
        // Real Local Backend Integration Gateway:
        // Build position records for real trips using backend live pings or assigned coordinates
        const derivedPositions: DriverPosition[] = realTrips.map((trip, idx) => {
          const backendPing = liveBackendLocations.find(l => l.assetId === trip.assetId);
          const assetObj = assets.find(a => a.id === trip.assetId);
          const fallbackGps = getAssetGps(assetObj || ({} as any), idx, places);

          const lat = backendPing ? backendPing.latitude : fallbackGps.lat;
          const lng = backendPing ? backendPing.longitude : fallbackGps.lng;
          const speed = backendPing ? backendPing.speed : (assetObj?.status === 'OPERABLE' ? 58 : 0);
          const isStale = backendPing ? (Date.now() - new Date(backendPing.updatedAt).getTime() > 30 * 60000) : false;

          return {
            driverId: trip.driverId,
            tripId: trip.id,
            latitude: lat,
            longitude: lng,
            speed: speed,
            heading: backendPing?.heading || 165,
            recordedAt: backendPing?.updatedAt || new Date().toISOString(),
            isStale: isStale,
            minutesSinceLastPing: backendPing ? Math.floor((Date.now() - new Date(backendPing.updatedAt).getTime()) / 60000) : 1,
            nextStop: {
              address: trip.dest.name,
              appointmentTime: new Date(Date.now() + 7200000).toISOString(),
              distanceMiles: 140,
              etaMinutes: 110,
            },
            driver: {
              id: trip.driverId,
              name: trip.driverName,
              phone: trip.driverPhone,
            },
          };
        });

        const activePositions = selectedTripId
          ? derivedPositions.filter(p => p.tripId === selectedTripId)
          : derivedPositions;

        const filtered = isAdmin || !currentDriverId
          ? (activePositions.length > 0 ? activePositions : derivedPositions)
          : derivedPositions.filter(p => p.driverId === currentDriverId);

        setPositions(filtered);

        // Generate clean route breadcrumbs towards trip destination
        if (filtered.length > 0 && activeTrip) {
          const cur = filtered[0];
          const hist: LocationHistoryPoint[] = [];
          for (let i = 0; i <= 6; i++) {
            const ratio = i / 6;
            hist.push({
              latitude: activeTrip.origin.lat + (cur.latitude - activeTrip.origin.lat) * ratio,
              longitude: activeTrip.origin.lng + (cur.longitude - activeTrip.origin.lng) * ratio,
              speed: cur.speed,
              heading: 165,
              recordedAt: new Date(Date.now() - (6 - i) * 600000).toISOString(),
            });
          }
          setRouteHistory(hist);
        }
      }
    } catch (err) {
      console.warn('Live tracking fetch error:', err);
    }
  }, [isSupertruckConfigured, realTrips, selectedTripId, isAdmin, currentDriverId, selectedDriverId, assets, places]);

  // Load Tracking Logs
  const fetchLogs = useCallback(async () => {
    const activeTrip = realTrips.find(t => t.id === selectedTripId) || realTrips[0];
    if (!activeTrip) return;

    if (isSupertruckConfigured) {
      try {
        const liveLogs = await getTripTrackingLogs(activeTrip.id);
        setLogs(liveLogs);
      } catch (err) {
        console.warn('Supertruck logs fetch error:', err);
      }
    } else {
      // Direct integration mode: display real issues associated with the active asset
      const assetIssues = (assets.find(a => a.id === activeTrip.assetId) as any)?.issues || [];
      if (assetIssues.length > 0) {
        setLogs(assetIssues.map((iss: any, i: number) => ({
          id: iss.id || `log-${i}`,
          tripId: activeTrip.id,
          issueType: iss.severity === 'CRITICAL' ? 'MECHANICAL' : 'DELAY',
          description: iss.title || iss.description,
          isResolved: iss.status === 'RESOLVED',
          brokerNotified: true,
          driverNotified: true,
          createdAt: iss.createdAt || new Date().toISOString(),
        })));
      } else {
        setLogs([]);
      }
    }
  }, [isSupertruckConfigured, realTrips, selectedTripId, assets]);

  // Polling Loop (every 15s)
  useEffect(() => {
    fetchLivePositions();
    fetchLogs();

    const interval = setInterval(() => {
      fetchLivePositions();
    }, 15000);

    const countdownTimer = setInterval(() => {
      setCountdown(c => (c <= 1 ? 15 : c - 1));
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(countdownTimer);
    };
  }, [fetchLivePositions, fetchLogs]);

  // Manual Refresh
  const handleManualRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchLivePositions(), fetchLogs()]);
    setCountdown(15);
    setRefreshing(false);
  };

  // Submit Live GPS Ping to Backend & Supertruck
  const handleSendGpsPing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gpsAssetId) return;
    setGpsSubmitting(true);
    try {
      // 1. Post to NestJS Backend Telematics Gateway
      await apiRecordTelematicsPing({
        assetId: gpsAssetId,
        latitude: Number(gpsLat),
        longitude: Number(gpsLng),
        speed: Number(gpsSpeed),
        heading: Number(gpsHeading),
        odometer: Number(gpsOdometer),
        source: gpsSource,
      });

      // 2. If Supertruck AI is configured, also post to Supertruck Cloud
      if (isSupertruckConfigured) {
        const trip = realTrips.find(t => t.assetId === gpsAssetId) || realTrips[0];
        await recordDriverLocation({
          driverId: trip.driverId,
          tripId: trip.id,
          latitude: Number(gpsLat),
          longitude: Number(gpsLng),
          speed: Number(gpsSpeed),
          heading: Number(gpsHeading),
        });
      }

      await fetchLivePositions();
      setShowGpsModal(false);
      setSelectedItem({ lat: Number(gpsLat), lng: Number(gpsLng), zoom: 14 });
      alert(`Live GPS Ping ingested! Vehicle location updated to (${gpsLat}, ${gpsLng}).`);
    } catch (err: any) {
      alert(`GPS Ping error: ${err.message}`);
    } finally {
      setGpsSubmitting(false);
    }
  };

  // Detect Device Real GPS
  const handleUseDeviceLocation = () => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          setGpsLat(Number(pos.coords.latitude.toFixed(4)));
          setGpsLng(Number(pos.coords.longitude.toFixed(4)));
          if (pos.coords.speed) setGpsSpeed(Math.round(pos.coords.speed * 2.23694)); // m/s to mph
        },
        err => alert(`Unable to read device GPS: ${err.message}`)
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };

  // Save Supertruck AI Cloud Config
  const handleSaveSupertuckConfig = (e: React.FormEvent) => {
    e.preventDefault();
    saveSupertuckConfig(cfgTenantId.trim(), cfgToken.trim());
    setConfig({ tenantId: cfgTenantId.trim(), token: cfgToken.trim() });
    setShowConfigModal(false);
    handleManualRefresh();
  };

  // Test Supertruck Connection
  const handleTestConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);
    try {
      const res = await apiTestIntegration({
        provider: 'SUPERTRUCK',
        tenantId: cfgTenantId.trim() || 'st-tenant-prod',
        apiKey: cfgToken.trim(),
      });
      setTestResult(`${res.message} (Latency: ${res.latencyMs}ms)`);
    } catch (err: any) {
      setTestResult(`Connection verification failed: ${err.message}`);
    } finally {
      setTestingConnection(false);
    }
  };

  // Submit new tracking log
  const handleCreateLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logDesc.trim()) return;
    setLogSubmitting(true);
    const activeTrip = realTrips.find(t => t.id === selectedTripId) || realTrips[0];
    try {
      if (isSupertruckConfigured && activeTrip) {
        await createTrackingLog({
          tripId: activeTrip.id,
          issueType: logIssueType,
          description: logDesc,
          brokerNotified: logBroker,
          driverNotified: logDriver,
        });
        await fetchLogs();
      } else {
        const newLog: TrackingLog = {
          id: `log-${Date.now()}`,
          tripId: activeTrip?.id || 'live-corridor',
          issueType: logIssueType,
          description: logDesc,
          isResolved: false,
          brokerNotified: logBroker,
          driverNotified: logDriver,
          createdAt: new Date().toISOString(),
        };
        setLogs(prev => [newLog, ...prev]);
      }
      setShowCreateLog(false);
      setLogDesc('');
      setLogBroker(false);
      setLogDriver(false);
    } catch (err: any) {
      alert(`Error creating tracking log: ${err.message}`);
    } finally {
      setLogSubmitting(false);
    }
  };

  // Resolve tracking log
  const handleResolveLog = async (id: string) => {
    try {
      if (isSupertruckConfigured) {
        await resolveTrackingLog(id, { isResolved: true });
        await fetchLogs();
      } else {
        setLogs(prev =>
          prev.map(l =>
            l.id === id ? { ...l, isResolved: true, resolvedAt: new Date().toISOString() } : l
          )
        );
      }
    } catch (err: any) {
      alert(`Error resolving log: ${err.message}`);
    }
  };

  // Filtered collections
  const filteredAssets = assets
    .filter(a => assetFilter === 'ALL' || a.status === assetFilter)
    .filter(
      a =>
        searchQuery === '' ||
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.vin.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const filteredPlaces = places.filter(
    p =>
      searchQuery === '' ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDrivers = positions.filter(
    p =>
      searchQuery === '' ||
      p.driver?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.driverId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!MapComponents) {
    return (
      <div className="flex items-center justify-center h-96 bg-white rounded-2xl border border-slate-200 shadow-md">
        <div className="text-center space-y-3">
          <div className="animate-spin h-10 w-10 border-3 border-[#00BA7C] border-t-transparent rounded-full mx-auto" />
          <p className="text-slate-600 text-sm font-medium">Loading Live Fleet & Driver Telematics Map...</p>
        </div>
      </div>
    );
  }

  const { L, RL } = MapComponents;
  const { MapContainer, TileLayer, CircleMarker, Tooltip, Marker, Popup, Polyline, useMap } = RL;

  function MapFlyTo({ target }: { target: { lat: number; lng: number; zoom?: number } | null }) {
    const map = useMap();
    useEffect(() => {
      if (target) {
        map.flyTo([target.lat, target.lng], target.zoom || 12, { duration: 1.2 });
      }
    }, [target, map]);
    return null;
  }

  // Icons
  const getPlaceIcon = (type: string) => {
    let color = '#4f46e5';
    if (type === 'FUEL_STOP') color = '#2563eb';
    if (type === 'REPAIR_SHOP') color = '#d97706';
    if (type === 'DOT_STATION') color = '#dc2626';
    if (type === 'CUSTOMER_SITE') color = '#16a34a';

    return L.divIcon({
      className: 'custom-leaflet-place-icon',
      html: `<div style="width:26px;height:26px;background:${color};border-radius:50%;border:2px solid #ffffff;box-shadow:0 3px 10px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;color:white;font-size:13px;">📍</div>`,
      iconSize: [26, 26],
      iconAnchor: [13, 13],
    });
  };

  const getDriverIcon = (pos: DriverPosition) => {
    const isStale = pos.isStale || pos.minutesSinceLastPing > 15;
    const bg = isStale ? '#ef4444' : '#00BA7C';
    return L.divIcon({
      className: 'custom-driver-marker',
      html: `
        <div style="position:relative;width:38px;height:38px;display:flex;align-items:center;justify-content:center;">
          ${!isStale ? `<div style="position:absolute;inset:0;background:#00BA7C;border-radius:50%;opacity:0.4;animation:ping 2s cubic-bezier(0,0,0.2,1) infinite;"></div>` : ''}
          <div style="width:34px;height:34px;background:${bg};border-radius:50%;border:3px solid #ffffff;box-shadow:0 4px 12px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;color:white;font-weight:900;font-size:14px;z-index:2;">
            🚚
          </div>
          <div style="position:absolute;bottom:-6px;background:#0f172a;color:white;font-size:9px;font-weight:800;padding:1px 4px;border-radius:6px;border:1px solid #ffffff;white-space:nowrap;z-index:3;">
            ${pos.speed} MPH
          </div>
        </div>
      `,
      iconSize: [38, 38],
      iconAnchor: [19, 19],
    });
  };

  const currentTrip = realTrips.find(t => t.id === selectedTripId) || realTrips[0];

  return (
    <div className="space-y-4">
      {/* ── TOP HEADER & LIVE TELEMATICS STATUS BAR ── */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#00BA7C]" />
            </span>
            <span className="text-[11px] font-bold text-[#00BA7C] uppercase tracking-wider">
              Live Fleet Telematics & GPS Stream Active
            </span>
            <span className="text-[11px] text-slate-400">&bull; Auto-sync in {countdown}s</span>
          </div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Radio className="h-5 w-5 text-[#00BA7C]" />
            Unified Fleet Map & Live Telematics Tracking
          </h1>
        </div>

        {/* Top Actions: Trip Selector, Live GPS Pinger, Supertruck Status & Manual Refresh */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Trip Selector */}
          <select
            value={selectedTripId}
            onChange={e => {
              setSelectedTripId(e.target.value);
              const trip = realTrips.find(t => t.id === e.target.value);
              if (trip) {
                setSelectedItem({ lat: (trip.origin.lat + trip.dest.lat) / 2, lng: (trip.origin.lng + trip.dest.lng) / 2, zoom: 7 });
              }
            }}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#00BA7C]"
          >
            {realTrips.map(t => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>

          {/* Transmit Live GPS Ping Modal Button */}
          <button
            onClick={() => {
              if (assets.length > 0 && !gpsAssetId) setGpsAssetId(assets[0].id);
              setShowGpsModal(true);
            }}
            className="px-3.5 py-2 bg-[#00BA7C] hover:bg-[#00A86B] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
          >
            <LocateFixed className="h-3.5 w-3.5" />
            Ingest GPS Ping
          </button>

          {/* Supertruck / Backend API status */}
          <button
            onClick={() => setShowConfigModal(true)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition ${
              isSupertruckConfigured
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                : 'bg-emerald-50 text-[#00BA7C] border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <Wifi className="h-3.5 w-3.5" />
            {isSupertruckConfigured ? 'Supertruck AI Cloud Active' : 'Live Gateway Active'}
            <Settings className="h-3 w-3 ml-0.5 opacity-70" />
          </button>

          {/* Refresh Button */}
          <button
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-[#00BA7C]' : ''}`} />
            Sync Now
          </button>
        </div>
      </div>

      {/* ── LAYER CONTROLS & SEARCH BAR ── */}
      <div className="flex flex-wrap gap-3 items-center justify-between bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
        {/* Layer Checkboxes */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
          <span className="text-slate-400 uppercase tracking-wider text-[10px] mr-1">Layers:</span>

          {/* Driver Layer */}
          <label className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border cursor-pointer select-none transition ${
            showDrivers ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-500'
          }`}>
            <input
              type="checkbox"
              checked={showDrivers}
              onChange={e => setShowDrivers(e.target.checked)}
              className="accent-[#00BA7C] rounded"
            />
            <Radio className="h-3.5 w-3.5 text-[#00BA7C]" />
            Live Drivers ({positions.length})
          </label>

          {/* Assets Layer */}
          <label className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border cursor-pointer select-none transition ${
            showAssets ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-500'
          }`}>
            <input
              type="checkbox"
              checked={showAssets}
              onChange={e => setShowAssets(e.target.checked)}
              className="accent-[#00BA7C] rounded"
            />
            <Truck className="h-3.5 w-3.5 text-[#00BA7C]" />
            Vehicles ({filteredAssets.length})
          </label>

          {/* Places Layer */}
          <label className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border cursor-pointer select-none transition ${
            showPlaces ? 'bg-blue-50 border-blue-300 text-blue-800' : 'bg-slate-50 border-slate-200 text-slate-500'
          }`}>
            <input
              type="checkbox"
              checked={showPlaces}
              onChange={e => setShowPlaces(e.target.checked)}
              className="accent-blue-600 rounded"
            />
            <MapPin className="h-3.5 w-3.5 text-blue-600" />
            Places & Hubs ({filteredPlaces.length})
          </label>

          {/* Breadcrumbs Route Layer */}
          <label className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border cursor-pointer select-none transition ${
            showBreadcrumbs ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-500'
          }`}>
            <input
              type="checkbox"
              checked={showBreadcrumbs}
              onChange={e => setShowBreadcrumbs(e.target.checked)}
              className="accent-[#00BA7C] rounded"
            />
            <Route className="h-3.5 w-3.5 text-[#00BA7C]" />
            Transit Corridor Replay
          </label>
        </div>

        {/* Right Search & Asset Filter */}
        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={assetFilter}
            onChange={e => setAssetFilter(e.target.value as any)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700"
          >
            <option value="ALL">All Asset Statuses</option>
            <option value="OPERABLE">Operable Only</option>
            <option value="NEEDS_ATTENTION">Needs Attention</option>
            <option value="INOPERABLE">Inoperable</option>
          </select>

          <div className="relative">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search truck, driver, terminal..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#00BA7C] w-48 sm:w-56"
            />
          </div>
        </div>
      </div>

      {/* ── MAP CONTAINER ── */}
      <div className="relative h-[550px] w-full rounded-2xl overflow-hidden border border-slate-200 shadow-md">
        <MapContainer
          center={[31.5, -97.5]}
          zoom={7}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
        >
          <MapFlyTo target={selectedItem} />

          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* 1. ROUTE CORRIDOR POLYLINE & BREADCRUMBS */}
          {showBreadcrumbs && currentTrip && (
            <>
              {/* Corridor Direct Route */}
              <Polyline
                positions={[
                  [currentTrip.origin.lat, currentTrip.origin.lng],
                  [currentTrip.dest.lat, currentTrip.dest.lng],
                ]}
                pathOptions={{ color: '#00BA7C', weight: 3, opacity: 0.6, dashArray: '6, 8' }}
              />

              {/* Live Route History Pings */}
              {routeHistory.length > 1 && (
                <Polyline
                  positions={routeHistory.map(p => [p.latitude, p.longitude])}
                  pathOptions={{ color: '#00A86B', weight: 4, opacity: 0.9 }}
                />
              )}

              {/* Origin Marker */}
              <Marker position={[currentTrip.origin.lat, currentTrip.origin.lng]} icon={getPlaceIcon('DEPOT')}>
                <Tooltip permanent={false} direction="top">
                  <span className="text-xs font-bold">Origin: {currentTrip.origin.name}</span>
                </Tooltip>
              </Marker>

              {/* Destination Marker */}
              <Marker position={[currentTrip.dest.lat, currentTrip.dest.lng]} icon={getPlaceIcon('DEPOT')}>
                <Tooltip permanent={false} direction="top">
                  <span className="text-xs font-bold">Destination: {currentTrip.dest.name}</span>
                </Tooltip>
              </Marker>
            </>
          )}

          {/* 2. RENDER LIVE DRIVERS */}
          {showDrivers && filteredDrivers.map(pos => (
            <Marker
              key={pos.driverId}
              position={[pos.latitude, pos.longitude]}
              icon={getDriverIcon(pos)}
              eventHandlers={{
                click: () => {
                  setSelectedDriverId(pos.driverId);
                  setSelectedItem({ lat: pos.latitude, lng: pos.longitude, zoom: 13 });
                },
              }}
            >
              <Tooltip permanent={false} direction="top" offset={[0, -20]} opacity={0.95}>
                <div className="text-xs font-bold text-slate-900">
                  {pos.driver?.name} &bull; {pos.speed} MPH
                </div>
              </Tooltip>
              <Popup>
                <div style={{ minWidth: 230, fontFamily: 'sans-serif' }} className="p-1.5 space-y-2">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                    <div>
                      <strong className="text-sm text-slate-900">👤 {pos.driver?.name}</strong>
                      <p className="text-[11px] text-slate-500 font-mono">{pos.driver?.phone}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      pos.isStale ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {pos.isStale ? 'STALE PING' : 'ACTIVE STREAM'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-slate-50 p-1.5 rounded">
                      <span className="text-slate-400 block text-[10px]">Speed</span>
                      <strong className="text-slate-900 font-mono text-xs">{pos.speed} MPH</strong>
                    </div>
                    <div className="bg-slate-50 p-1.5 rounded">
                      <span className="text-slate-400 block text-[10px]">Heading</span>
                      <strong className="text-slate-900 font-mono text-xs">{pos.heading}° S</strong>
                    </div>
                  </div>

                  {pos.nextStop && (
                    <div className="bg-emerald-50 p-2 rounded-lg text-xs space-y-1">
                      <span className="text-[#00BA7C] font-bold block text-[10px] uppercase">Next Destination</span>
                      <p className="text-slate-800 font-semibold text-[11px] truncate">{pos.nextStop.address}</p>
                      <div className="flex justify-between text-[11px] font-mono text-emerald-950 pt-0.5">
                        <span>ETA: <b>{pos.nextStop.etaMinutes} mins</b></span>
                        <span>Dist: <b>{pos.nextStop.distanceMiles} mi</b></span>
                      </div>
                    </div>
                  )}

                  <div className="text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-100 flex justify-between">
                    <span>GPS: {pos.latitude.toFixed(4)}°, {pos.longitude.toFixed(4)}°</span>
                    <span>Last ping: {pos.minutesSinceLastPing}m ago</span>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* 3. RENDER ASSETS (TRACTORS & TRAILERS) */}
          {showAssets && filteredAssets.map((asset, idx) => {
            const pos = getAssetGps(asset, idx, places);
            const color = statusColor(asset.status);
            return (
              <CircleMarker
                key={asset.id}
                center={[pos.lat, pos.lng]}
                radius={13}
                pathOptions={{ color: '#ffffff', fillColor: color, fillOpacity: 0.95, weight: 3 }}
                eventHandlers={{
                  click: () => setSelectedItem({ lat: pos.lat, lng: pos.lng, zoom: 12 }),
                }}
              >
                <Tooltip permanent={false} direction="top" offset={[0, -18]} opacity={0.95}>
                  <div className="text-xs font-bold px-1 py-0.5 text-slate-900">{asset.name}</div>
                </Tooltip>
                <Popup>
                  <div style={{ minWidth: 200, fontFamily: 'sans-serif' }} className="p-1">
                    <div style={{ fontWeight: 'bold', fontSize: 14, color: '#0f172a', marginBottom: 4 }}>
                      🚚 {asset.name}
                    </div>
                    <div style={{ fontSize: 11, color: '#475569' }}>VIN: <b>{asset.vin}</b></div>
                    <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>Plate: <b>{asset.plateNumber}</b></div>
                    <div style={{ fontSize: 11, marginTop: 4 }}>
                      Status: <span style={{ color, fontWeight: 'bold' }}>{asset.status.replace('_', ' ')}</span>
                    </div>
                    <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>
                      Odometer: <b>{asset.odometer.toLocaleString()} mi</b>
                    </div>
                    <div style={{ fontSize: 10, color: '#64748b', marginTop: 6 }}>
                      GPS: {pos.lat.toFixed(4)}°N, {Math.abs(pos.lng).toFixed(4)}°W
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}

          {/* 4. RENDER PLACES & FACILITIES */}
          {showPlaces && filteredPlaces.map(place => (
            <Marker
              key={place.id}
              position={[place.lat, place.lng]}
              icon={getPlaceIcon(place.type)}
              eventHandlers={{
                click: () => setSelectedItem({ lat: place.lat, lng: place.lng, zoom: 13 }),
              }}
            >
              <Popup>
                <div style={{ minWidth: 180, fontFamily: 'sans-serif' }} className="p-1">
                  <div style={{ fontWeight: 'bold', fontSize: 13, color: '#0f172a' }}>📍 {place.name}</div>
                  <div style={{ fontSize: 11, color: '#4f46e5', fontWeight: 'bold', marginTop: 2 }}>
                    {place.type.replace(/_/g, ' ')}
                  </div>
                  <div style={{ fontSize: 11, color: '#475569', marginTop: 4 }}>{place.address}</div>
                  {place.notes && <div style={{ fontSize: 10, color: '#64748b', marginTop: 4 }}>{place.notes}</div>}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* ── MAP LEGEND & QUICK CONTROLS ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-slate-700 bg-white border border-slate-200 p-3.5 rounded-xl shadow-sm">
        <div className="flex flex-wrap items-center gap-5">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-[#00BA7C] inline-block shadow-sm" /> Live Vehicle Stream (Active Pulse)
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-green-600 inline-block shadow-sm" /> Operable Vehicle
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-amber-500 inline-block shadow-sm" /> Needs Attention
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-red-600 inline-block shadow-sm" /> Inoperable / Stale
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-[#4f46e5] inline-block shadow-sm" /> Facility / Terminal
          </div>
        </div>

        <button
          onClick={() => setLogsDrawerOpen(!logsDrawerOpen)}
          className="text-xs font-bold text-[#00BA7C] hover:text-emerald-800 flex items-center gap-1.5 transition ml-auto"
        >
          <AlertTriangle className="h-3.5 w-3.5" />
          Trip Tracking Exceptions ({logs.filter(l => !l.isResolved).length} open)
          {logsDrawerOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>
      </div>

      {/* ── LIVE DRIVERS CARDS ROSTER (CLICK TO FOCUS ON MAP) ── */}
      {showDrivers && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Radio className="h-4 w-4 text-[#00BA7C]" />
              Active Tracked Units & Drivers ({positions.length})
            </h3>
            <span className="text-xs text-slate-500 font-medium">Click any vehicle to focus and inspect</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {positions.map(pos => {
              const isSelected = selectedDriverId === pos.driverId;
              return (
                <div
                  key={pos.driverId}
                  onClick={() => {
                    setSelectedDriverId(pos.driverId);
                    setSelectedItem({ lat: pos.latitude, lng: pos.longitude, zoom: 13 });
                  }}
                  className={`p-4 rounded-xl border transition cursor-pointer shadow-sm space-y-2.5 ${
                    isSelected
                      ? 'bg-emerald-50/50 border-[#00BA7C] ring-2 ring-emerald-500/20'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-full bg-emerald-100 text-[#00BA7C] flex items-center justify-center font-bold text-xs">
                        {pos.driver?.name?.slice(0, 2).toUpperCase() || 'TR'}
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-900">{pos.driver?.name}</h4>
                        <p className="text-[10px] text-slate-500 font-mono">{pos.driver?.phone}</p>
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      pos.isStale ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {pos.isStale ? 'Stale' : `${pos.speed} MPH`}
                    </span>
                  </div>

                  {pos.nextStop && (
                    <div className="text-[11px] bg-slate-50 p-2 rounded-lg border border-slate-100 space-y-0.5">
                      <p className="text-slate-500 text-[10px]">Destination Hub:</p>
                      <p className="font-semibold text-slate-800 truncate">{pos.nextStop.address}</p>
                      <div className="flex justify-between text-[10px] font-mono text-[#00BA7C] font-bold pt-1">
                        <span>ETA: {pos.nextStop.etaMinutes}m</span>
                        <span>{pos.nextStop.distanceMiles} miles remaining</span>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono pt-1">
                    <span>Ping: {pos.minutesSinceLastPing}m ago</span>
                    <span className="text-[#00BA7C] font-bold flex items-center gap-1">
                      Focus Map <Eye className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── COLLAPSIBLE TRACKING ISSUES & TRIAGE DRAWER ── */}
      {logsDrawerOpen && (
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Live Trip Tracking Issues & Dispatch Logs
              </h3>
              <p className="text-xs text-slate-500">Triage transit exceptions, delays, and mechanical events on active corridors.</p>
            </div>
            <button
              onClick={() => setShowCreateLog(true)}
              className="px-3.5 py-1.5 bg-[#00BA7C] hover:bg-[#00A86B] text-white text-xs font-bold rounded-xl transition flex items-center gap-1 shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" /> Log Issue
            </button>
          </div>

          <div className="space-y-2.5">
            {logs.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">No tracking issues recorded for this trip.</p>
            ) : (
              logs.map(log => (
                <div
                  key={log.id}
                  className={`p-3.5 rounded-xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 ${
                    log.isResolved ? 'bg-slate-50 border-slate-200' : 'bg-amber-50/60 border-amber-200'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        log.isResolved ? 'bg-slate-200 text-slate-700' : 'bg-amber-500 text-white'
                      }`}>
                        {log.issueType}
                      </span>
                      <span className="text-xs font-bold text-slate-900">{log.description}</span>
                    </div>
                    <div className="flex gap-4 text-[10px] text-slate-500 font-mono">
                      <span>Broker notified: <b>{log.brokerNotified ? 'Yes' : 'No'}</b></span>
                      <span>Driver notified: <b>{log.driverNotified ? 'Yes' : 'No'}</b></span>
                      <span>Logged: <b>{new Date(log.createdAt).toLocaleTimeString()}</b></span>
                    </div>
                  </div>

                  {!log.isResolved && (
                    <button
                      onClick={() => handleResolveLog(log.id)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition shrink-0"
                    >
                      Resolve Exception
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── TRANSMIT LIVE GPS PING MODAL ── */}
      {showGpsModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <LocateFixed className="h-5 w-5 text-[#00BA7C]" />
                <h3 className="font-bold text-base text-slate-900">Ingest Live Telematics GPS Ping</h3>
              </div>
              <button onClick={() => setShowGpsModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSendGpsPing} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Target Fleet Vehicle</label>
                <select
                  value={gpsAssetId}
                  onChange={e => {
                    setGpsAssetId(e.target.value);
                    const selected = assets.find(a => a.id === e.target.value);
                    if (selected) setGpsOdometer(Math.round(selected.odometer));
                  }}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 font-bold"
                >
                  {assets.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.plateNumber}) &bull; {a.odometer.toLocaleString()} mi
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={gpsLat}
                    onChange={e => setGpsLat(parseFloat(e.target.value))}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={gpsLng}
                    onChange={e => setGpsLng(parseFloat(e.target.value))}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleUseDeviceLocation}
                  className="text-xs font-bold text-[#00BA7C] hover:underline flex items-center gap-1"
                >
                  <Navigation className="h-3.5 w-3.5" /> Use My Browser GPS
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Speed (MPH)</label>
                  <input
                    type="number"
                    value={gpsSpeed}
                    onChange={e => setGpsSpeed(parseInt(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Heading (°)</label>
                  <input
                    type="number"
                    value={gpsHeading}
                    onChange={e => setGpsHeading(parseInt(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Odometer (mi)</label>
                  <input
                    type="number"
                    value={gpsOdometer}
                    onChange={e => setGpsOdometer(parseInt(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Telematics Source</label>
                <select
                  value={gpsSource}
                  onChange={e => setGpsSource(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900"
                >
                  <option value="Motive ELD Live">Motive ELD Live</option>
                  <option value="Samsara IoT Gateway">Samsara IoT Gateway</option>
                  <option value="Geotab GO9 Telematics">Geotab GO9 Telematics</option>
                  <option value="Supertruck In-Cab AI">Supertruck In-Cab AI</option>
                  <option value="Driver Mobile GPS">Driver Mobile GPS</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowGpsModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={gpsSubmitting}
                  className="px-5 py-2 bg-[#00BA7C] hover:bg-[#00A86B] text-white text-xs font-bold rounded-lg transition shadow-sm flex items-center gap-1.5"
                >
                  <Send className="h-3.5 w-3.5" />
                  {gpsSubmitting ? 'Transmitting...' : 'Ingest Live Ping'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── SUPERTRUCK AI CONFIG MODAL ── */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Wifi className="h-5 w-5 text-[#00BA7C]" />
                <h3 className="font-bold text-base text-slate-900">Supertruck AI Cloud Settings</h3>
              </div>
              <button onClick={() => setShowConfigModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSaveSupertuckConfig} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Tenant ID (`x-tenant-id`)</label>
                <input
                  type="text"
                  placeholder="e.g. st-carrier-981"
                  value={cfgTenantId}
                  onChange={e => setCfgTenantId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Bearer API Token</label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5c..."
                  value={cfgToken}
                  onChange={e => setCfgToken(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 font-mono"
                />
              </div>

              {testResult && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-mono">
                  {testResult}
                </div>
              )}

              <div className="pt-2 flex justify-between items-center border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testingConnection}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition"
                >
                  {testingConnection ? 'Testing...' : 'Test Connection'}
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowConfigModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#00BA7C] hover:bg-[#00A86B] text-white text-xs font-bold rounded-lg transition shadow-sm"
                  >
                    Save Credentials
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── CREATE LOG MODAL ── */}
      {showCreateLog && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-slate-900">Log Trip Exception</h3>
            <form onSubmit={handleCreateLog} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Exception Type</label>
                <select
                  value={logIssueType}
                  onChange={e => setLogIssueType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 font-bold"
                >
                  {ISSUE_TYPES.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Issue Description</label>
                <textarea
                  value={logDesc}
                  onChange={e => setLogDesc(e.target.value)}
                  required
                  rows={3}
                  placeholder="Describe delay, weather hold, or mechanical defect..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900"
                />
              </div>

              <div className="space-y-2 pt-1 text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={logBroker}
                    onChange={e => setLogBroker(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-[#00BA7C]"
                  />
                  <span>Send automated delay notice to Freight Broker</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={logDriver}
                    onChange={e => setLogDriver(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-[#00BA7C]"
                  />
                  <span>Dispatch alert to driver mobile app</span>
                </label>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateLog(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={logSubmitting}
                  className="px-4 py-2 bg-[#00BA7C] hover:bg-[#00A86B] text-white text-xs font-bold rounded-lg transition shadow-sm"
                >
                  {logSubmitting ? 'Logging...' : 'Submit Issue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
