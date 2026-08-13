'use client';
import React, { useEffect, useState } from 'react';
import { Asset, Place } from '../mockDb';
import { MapPin, Navigation, Search, Crosshair, Eye, Radio, Truck } from 'lucide-react';
import DriverTrackingMap from './DriverTrackingMap';

interface Props {
  assets: Asset[];
  places: Place[];
  isAdmin?: boolean;
  currentDriverId?: string;
}

const statusColor = (s: string) => s === 'OPERABLE' ? '#16a34a' : s === 'NEEDS_ATTENTION' ? '#d97706' : '#dc2626';

// Dynamic coordinate generator for real assets based on ID/VIN
function getAssetGps(asset: Asset, idx: number) {
  let charSum = 0;
  const str = asset.vin || asset.id || 'asset';
  for (let i = 0; i < str.length; i++) {
    charSum += str.charCodeAt(i);
  }
  const baseLat = 30.0 + ((charSum * 13 + idx * 47) % 350) / 100;
  const baseLng = -98.0 + ((charSum * 31 + idx * 73) % 450) / 100;
  return { lat: Number(baseLat.toFixed(4)), lng: Number(baseLng.toFixed(4)) };
}

export default function FleetMap({ assets, places, isAdmin = false, currentDriverId }: Props) {
  const [activeView, setActiveView] = useState<'assets' | 'live'>('assets');
  const [MapComponents, setMapComponents] = useState<any>(null);
  const [filter, setFilter] = useState<'ALL' | 'OPERABLE' | 'NEEDS_ATTENTION' | 'INOPERABLE'>('ALL');
  const [showPlaces, setShowPlaces] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<{ lat: number; lng: number; zoom?: number } | null>(null);

  useEffect(() => {
    // Dynamically import leaflet-related modules for SSR safety
    Promise.all([
      import('leaflet'),
      import('react-leaflet')
    ]).then(([L, RL]) => {
      // Fix default leaflet marker icon paths
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });
      setMapComponents({ L, RL });
    });
  }, []);

  const filteredAssets = assets
    .filter(a => filter === 'ALL' || a.status === filter)
    .filter(a => searchQuery === '' || a.name.toLowerCase().includes(searchQuery.toLowerCase()) || a.vin.toLowerCase().includes(searchQuery.toLowerCase()));

  const filteredPlaces = places.filter(p => searchQuery === '' || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.address.toLowerCase().includes(searchQuery.toLowerCase()));

  if (!MapComponents) {
    return (
      <div className="flex items-center justify-center h-96 bg-white rounded-2xl border border-slate-200 shadow-md">
        <div className="text-center space-y-3">
          <div className="animate-spin h-10 w-10 border-3 border-indigo-600 border-t-transparent rounded-full mx-auto" />
          <p className="text-slate-600 text-sm font-medium">Loading White Theme Leaflet Map...</p>
        </div>
      </div>
    );
  }

  const { L, RL } = MapComponents;
  const { MapContainer, TileLayer, CircleMarker, Tooltip, Marker, Popup, useMap } = RL;

  // Custom component for flying/animating map position smoothly
  function MapFlyTo({ target }: { target: { lat: number; lng: number; zoom?: number } | null }) {
    const map = useMap();
    useEffect(() => {
      if (target) {
        map.flyTo([target.lat, target.lng], target.zoom || 12, { duration: 1.2 });
      }
    }, [target, map]);
    return null;
  }

  // Create custom HTML div icon for places
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

  return (
    <div className="space-y-4">
      {/* View Toggle */}
      <div className="flex gap-2 bg-white border border-slate-200 p-1 rounded-xl shadow-sm w-fit">
        <button
          onClick={() => setActiveView('assets')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
            activeView === 'assets'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Truck className="h-3.5 w-3.5" /> Asset Map
        </button>
        <button
          onClick={() => setActiveView('live')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
            activeView === 'live'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Radio className="h-3.5 w-3.5" />
          Live Driver Tracking
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              activeView === 'live' ? 'bg-white' : 'bg-emerald-500'
            }`} />
            <span className={`relative inline-flex rounded-full h-2 w-2 ${
              activeView === 'live' ? 'bg-white' : 'bg-emerald-500'
            }`} />
          </span>
        </button>
      </div>

      {/* Live Driver Tracking Panel */}
      {activeView === 'live' && (
        <DriverTrackingMap isAdmin={isAdmin} currentDriverId={currentDriverId} />
      )}

      {/* Asset Map (existing) */}
      {activeView !== 'live' && (<>
      {/* White Controls & Search Toolbar */}
      <div className="flex flex-wrap gap-3 items-center justify-between bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
        <div className="flex gap-2 flex-wrap items-center">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">Status:</span>
          {(['ALL', 'OPERABLE', 'NEEDS_ATTENTION', 'INOPERABLE'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                filter === f
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              {f.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-64">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search assets or places..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
            />
          </div>

          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl border border-slate-200 transition">
            <input
              type="checkbox"
              checked={showPlaces}
              onChange={e => setShowPlaces(e.target.checked)}
              className="accent-indigo-600 rounded"
            />
            Show Places
          </label>

          <button
            onClick={() => setSelectedItem({ lat: 31.5, lng: -96.5, zoom: 6 })}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition"
            title="Reset Map View"
          >
            <Crosshair className="h-3.5 w-3.5 text-indigo-600" />
            Reset View
          </button>
        </div>
      </div>

      {/* White Clean Leaflet Map Canvas */}
      <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-md relative bg-slate-50" style={{ height: '520px' }}>
        <MapContainer
          center={[31.5, -96.5]}
          zoom={6}
          style={{ height: '100%', width: '100%' }}
          className="z-0 bg-slate-100"
        >
          <TileLayer
            url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
            attribution='&copy; <a href="https://maps.google.com">Google Maps</a>'
          />

          <MapFlyTo target={selectedItem} />

          {/* Render Assets on White Map */}
          {filteredAssets.map((asset, idx) => {
            const pos = getAssetGps(asset, idx);
            const color = statusColor(asset.status);
            return (
              <CircleMarker
                key={asset.id}
                center={[pos.lat, pos.lng]}
                radius={14}
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

          {/* Render Places on White Map */}
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

      {/* Map Legend */}
      <div className="flex flex-wrap gap-5 text-xs text-slate-700 bg-white border border-slate-200 p-3.5 rounded-xl shadow-sm">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-green-600 inline-block shadow-sm" /> Operable Asset
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-amber-500 inline-block shadow-sm" /> Needs Attention
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-red-600 inline-block shadow-sm" /> Inoperable
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-indigo-600 inline-block shadow-sm" /> Place / Facility
        </div>
      </div>

      {/* Interactive White Asset Grid below Map */}
      <div className="space-y-2">
        <h3 className="text-sm font-bold text-slate-800">Monitored Assets ({filteredAssets.length})</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {filteredAssets.map((asset, idx) => {
            const pos = getAssetGps(asset, idx);
            const color = statusColor(asset.status);
            return (
              <div
                key={asset.id}
                onClick={() => setSelectedItem({ lat: pos.lat, lng: pos.lng, zoom: 12 })}
                className="bg-white border border-slate-200 hover:border-indigo-500/80 rounded-xl p-4 space-y-2 cursor-pointer transition shadow-sm hover:shadow-md group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition truncate">{asset.name}</span>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
                    style={{ background: color + '15', color, borderColor: color + '30' }}
                  >
                    {asset.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-600">
                  <span>VIN: {asset.vin.substring(0, 10)}...</span>
                  <span className="text-slate-500">{asset.odometer.toLocaleString()} mi</span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-100 pt-2">
                  <span className="flex items-center gap-1">
                    <Navigation className="h-3 w-3 text-indigo-600" />
                    {pos.lat.toFixed(4)}°, {pos.lng.toFixed(4)}°
                  </span>
                  <span className="text-indigo-600 group-hover:underline flex items-center gap-1 font-semibold">
                    Focus <Eye className="h-3 w-3 inline" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      </>)} {/* end asset view */}
    </div>
  );
}
