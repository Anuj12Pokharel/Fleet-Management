'use client';
import React, { useState } from 'react';
import { Place, User as DbUser } from '../mockDb';
import { apiCreatePlace } from '../lib/api-client';
import { Plus, MapPin, Fuel, Wrench, Building2, AlertTriangle } from 'lucide-react';

interface Props {
  places: Place[];
  currentUser: DbUser;
  onRefresh: () => void;
}

const typeConfig: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  DEPOT: { icon: <Building2 className="h-4 w-4" />, color: 'text-emerald-700', bg: 'bg-white border-emerald-200' },
  FUEL_STOP: { icon: <Fuel className="h-4 w-4" />, color: 'text-blue-700', bg: 'bg-white border-blue-200' },
  REPAIR_SHOP: { icon: <Wrench className="h-4 w-4" />, color: 'text-amber-700', bg: 'bg-white border-amber-200' },
  DOT_STATION: { icon: <AlertTriangle className="h-4 w-4" />, color: 'text-red-700', bg: 'bg-white border-red-200' },
  CUSTOMER_SITE: { icon: <MapPin className="h-4 w-4" />, color: 'text-green-700', bg: 'bg-white border-green-200' },
  OTHER: { icon: <MapPin className="h-4 w-4" />, color: 'text-slate-700', bg: 'bg-white border-slate-200' },
};

export default function Places({ places, currentUser, onRefresh }: Props) {
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Partial<Place>>({
    name: '', type: 'DEPOT', address: '', lat: 32.7767, lng: -96.7970, notes: ''
  });

  const canManage = ['MAINTENANCE_ADMIN', 'FLEET_MANAGER'].includes(currentUser.role);

  const displayed = typeFilter === 'ALL' ? places : places.filter(p => p.type === typeFilter);

  const handleSubmit = async () => {
    if (!form.name || !form.address) { alert('Name and address are required.'); return; }
    try {
      await apiCreatePlace({
        name: form.name!,
        type: form.type as Place['type'],
        address: form.address!,
        lat: form.lat || 0,
        lng: form.lng || 0,
        notes: form.notes || '',
      });
      setShowForm(false);
      setForm({ name: '', type: 'DEPOT', address: '', lat: 32.7767, lng: -96.7970, notes: '' });
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to save place to database.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary pills by type */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setTypeFilter('ALL')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${typeFilter === 'ALL' ? 'bg-[#00BA7C] text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
          All ({places.length})
        </button>
        {Object.keys(typeConfig).map(t => {
          const count = places.filter(p => p.type === t).length;
          if (!count) return null;
          const cfg = typeConfig[t];
          return (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition border ${typeFilter === t ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'}`}>
              <span className={typeFilter === t ? cfg.color : 'text-slate-500'}>{cfg.icon}</span>
              {t.replace('_', ' ')} ({count})
            </button>
          );
        })}
        {canManage && (
          <button onClick={() => setShowForm(!showForm)}
            className="ml-auto flex items-center gap-2 px-3 py-1.5 bg-[#00BA7C] hover:bg-[#00BA7C] rounded-xl text-xs font-bold text-white transition shadow-sm">
            <Plus className="h-3.5 w-3.5" /> Add Place
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 space-y-4">
          <h4 className="text-sm font-bold text-slate-900">Add New Place</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Name</label>
              <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Location name..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#00BA7C] font-medium" />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as any }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#00BA7C] font-medium">
                {Object.keys(typeConfig).map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Latitude</label>
              <input type="number" value={form.lat} onChange={e => setForm(f => ({ ...f, lat: +e.target.value }))} step="0.0001"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#00BA7C] font-medium" />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Longitude</label>
              <input type="number" value={form.lng} onChange={e => setForm(f => ({ ...f, lng: +e.target.value }))} step="0.0001"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#00BA7C] font-medium" />
            </div>
            <div className="md:col-span-2">
              <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Address</label>
              <input type="text" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                placeholder="Full street address..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#00BA7C] font-medium" />
            </div>
            <div className="md:col-span-3">
              <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Notes</label>
              <input type="text" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Contact info, hours, special instructions..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#00BA7C] font-medium" />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowForm(false)} className="px-3 py-1.5 bg-slate-100 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-200">Cancel</button>
            <button onClick={handleSubmit} className="px-3 py-1.5 bg-[#00BA7C] hover:bg-[#00BA7C] rounded-xl text-xs font-bold text-white shadow-sm">Save Place</button>
          </div>
        </div>
      )}

      {/* Place Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {displayed.map(place => {
          const cfg = typeConfig[place.type] || typeConfig.OTHER;
          return (
            <div key={place.id} className={`border rounded-2xl p-5 space-y-3 bg-white shadow-sm hover:shadow-md transition ${cfg.bg}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl bg-slate-50 border border-slate-100 ${cfg.color}`}>{cfg.icon}</div>
                  <div>
                    <p className="font-extrabold text-slate-900 text-sm">{place.name}</p>
                    <span className={`text-[10px] font-bold ${cfg.color}`}>{place.type.replace(/_/g, ' ')}</span>
                  </div>
                </div>
                <a
                  href={`https://maps.google.com/?q=${place.lat},${place.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-[#00BA7C] hover:text-emerald-700 transition font-bold"
                >
                  Maps ↗
                </a>
              </div>
              <div className="text-xs text-slate-600 font-medium">
                <MapPin className="h-3.5 w-3.5 inline mr-1 text-slate-400" />
                {place.address}
              </div>
              <div className="text-[10px] font-mono text-slate-500">
                {place.lat.toFixed(4)}°N, {Math.abs(place.lng).toFixed(4)}°W
              </div>
              {place.notes && (
                <div className="text-[11px] text-slate-500 border-t border-slate-100 pt-2 font-medium">
                  {place.notes}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
