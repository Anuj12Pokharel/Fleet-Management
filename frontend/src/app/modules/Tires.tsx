'use client';
import React, { useState } from 'react';
import { TireReading, Asset, User as DbUser, getStore, setStore, initialTireReadings } from '../mockDb';
import { Plus, AlertTriangle } from 'lucide-react';

interface Props {
  tireReadings: TireReading[];
  assets: Asset[];
  currentUser: DbUser;
  onRefresh: () => void;
}

const AXLE_POSITIONS: TireReading['axlePosition'][] = [
  'STEER_LEFT', 'STEER_RIGHT',
  'DRIVE1_LEFT', 'DRIVE1_RIGHT',
  'DRIVE2_LEFT', 'DRIVE2_RIGHT',
  'TRAILER_LEFT', 'TRAILER_RIGHT'
];

const psiStatus = (psi: number) => psi < 85 ? 'CRITICAL' : psi < 95 ? 'LOW' : 'OK';
const treadStatus = (t: number) => t < 3 ? 'CRITICAL' : t < 5 ? 'LOW' : 'OK';

const statusColors: Record<string, string> = {
  OK: 'text-green-400 bg-green-400/10',
  LOW: 'text-amber-400 bg-amber-400/10',
  CRITICAL: 'text-red-400 bg-red-400/10',
};

export default function Tires({ tireReadings, assets, currentUser, onRefresh }: Props) {
  const [selectedAsset, setSelectedAsset] = useState(assets[0]?.id || '');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<{
    axlePosition: TireReading['axlePosition'];
    tireBrand: string;
    psi: number;
    treadDepth: number;
  }>({ axlePosition: 'STEER_LEFT', tireBrand: '', psi: 110, treadDepth: 10 });

  const canRecord = ['MECHANIC', 'MAINTENANCE_ADMIN', 'FLEET_MANAGER'].includes(currentUser.role);

  const latestReadings = AXLE_POSITIONS.reduce((acc, pos) => {
    const reading = tireReadings
      .filter(r => r.assetId === selectedAsset && r.axlePosition === pos)
      .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime())[0];
    if (reading) acc[pos] = reading;
    return acc;
  }, {} as Record<string, TireReading>);

  const handleSubmit = () => {
    if (!form.tireBrand) { alert('Tire brand is required.'); return; }
    const newReading: TireReading = {
      id: 'tr-' + Math.random().toString(36).substr(2, 8),
      assetId: selectedAsset,
      axlePosition: form.axlePosition,
      tireBrand: form.tireBrand,
      psi: form.psi,
      treadDepth: form.treadDepth,
      recordedAt: new Date().toISOString(),
      recordedBy: currentUser.name
    };
    const all = getStore('tireReadings', initialTireReadings);
    all.unshift(newReading);
    setStore('tireReadings', all);
    setShowForm(false);
    onRefresh();
  };

  const TireCard = ({ pos }: { pos: TireReading['axlePosition'] }) => {
    const r = latestReadings[pos];
    if (!r) return (
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
        <p className="text-[10px] text-slate-500 font-bold font-mono">{pos.replace(/_/g, ' ')}</p>
        <p className="text-[10px] text-slate-400 mt-1 font-medium">No data</p>
      </div>
    );

    const ps = psiStatus(r.psi);
    const ts = treadStatus(r.treadDepth);
    const worst = (ps === 'CRITICAL' || ts === 'CRITICAL') ? 'CRITICAL' : (ps === 'LOW' || ts === 'LOW') ? 'LOW' : 'OK';

    return (
      <div className={`bg-slate-50 border rounded-xl p-3 space-y-2 ${worst === 'CRITICAL' ? 'border-red-300 bg-red-50/20' : worst === 'LOW' ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'}`}>
        <div className="flex items-center justify-between">
          <p className="text-[10px] text-slate-700 font-mono font-bold">{pos.replace(/_/g, ' ')}</p>
          {worst !== 'OK' && <AlertTriangle className="h-3 w-3 text-red-600" />}
        </div>
        <p className="text-[10px] text-slate-500 font-semibold truncate">{r.tireBrand}</p>
        <div className="space-y-1">
          <div className="flex justify-between text-[10px]">
            <span className="text-slate-500 font-medium">PSI</span>
            <span className="font-bold text-slate-900">{r.psi}</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-1.5">
            <div className={`h-1.5 rounded-full transition-all ${ps === 'OK' ? 'bg-emerald-500' : ps === 'LOW' ? 'bg-amber-500' : 'bg-red-500'}`}
              style={{ width: `${Math.min((r.psi / 120) * 100, 100)}%` }} />
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-[10px]">
            <span className="text-slate-500 font-medium">Tread</span>
            <span className={treadStatus(r.treadDepth) === 'OK' ? 'text-green-700 font-bold' : treadStatus(r.treadDepth) === 'LOW' ? 'text-amber-700 font-bold' : 'text-red-600 font-bold'}>{r.treadDepth}/32"</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-1.5">
            <div className={`h-1.5 rounded-full transition-all ${treadStatus(r.treadDepth) === 'OK' ? 'bg-emerald-500' : treadStatus(r.treadDepth) === 'LOW' ? 'bg-amber-500' : 'bg-red-500'}`}
              style={{ width: `${Math.min((r.treadDepth / 16) * 100, 100)}%` }} />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <select value={selectedAsset} onChange={e => setSelectedAsset(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:border-indigo-600 shadow-xs">
            {assets.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
        {canRecord && (
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold text-white transition shadow-sm">
            <Plus className="h-3.5 w-3.5" /> Record Reading
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 space-y-4">
          <h4 className="text-sm font-bold text-slate-900">New Tire Reading</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Position</label>
              <select value={form.axlePosition} onChange={e => setForm(f => ({ ...f, axlePosition: e.target.value as any }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 font-medium">
                {AXLE_POSITIONS.map(p => <option key={p} value={p}>{p.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Brand</label>
              <input type="text" value={form.tireBrand} onChange={e => setForm(f => ({ ...f, tireBrand: e.target.value }))}
                placeholder="e.g. Michelin"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 font-medium" />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">PSI</label>
              <input type="number" value={form.psi} onChange={e => setForm(f => ({ ...f, psi: +e.target.value }))}
                min={0} max={150}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 font-medium" />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Tread (32nds)</label>
              <input type="number" value={form.treadDepth} onChange={e => setForm(f => ({ ...f, treadDepth: +e.target.value }))}
                min={0} max={32}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 font-medium" />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowForm(false)} className="px-3 py-1.5 bg-slate-100 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-200">Cancel</button>
            <button onClick={handleSubmit} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold text-white shadow-sm">Save Reading</button>
          </div>
        </div>
      )}

      {/* Axle Diagram */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5">
        <h4 className="text-sm font-bold text-slate-900 mb-4">Axle Tire Status — {assets.find(a => a.id === selectedAsset)?.name}</h4>
        <div className="space-y-4">
          {/* Steer Axle */}
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">Steer Axle</p>
            <div className="grid grid-cols-2 gap-3">
              <TireCard pos="STEER_LEFT" />
              <TireCard pos="STEER_RIGHT" />
            </div>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">Drive Axle 1</p>
            <div className="grid grid-cols-2 gap-3">
              <TireCard pos="DRIVE1_LEFT" />
              <TireCard pos="DRIVE1_RIGHT" />
            </div>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">Drive Axle 2</p>
            <div className="grid grid-cols-2 gap-3">
              <TireCard pos="DRIVE2_LEFT" />
              <TireCard pos="DRIVE2_RIGHT" />
            </div>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">Trailer Axle</p>
            <div className="grid grid-cols-2 gap-3">
              <TireCard pos="TRAILER_LEFT" />
              <TireCard pos="TRAILER_RIGHT" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Readings History */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5">
        <h4 className="text-sm font-bold text-slate-900 mb-3">Reading History</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[10px] text-slate-500 font-bold uppercase border-b border-slate-200">
                <th className="text-left py-2 pr-4">Position</th>
                <th className="text-left py-2 pr-4">Brand</th>
                <th className="text-right py-2 pr-4">PSI</th>
                <th className="text-right py-2 pr-4">Tread</th>
                <th className="text-left py-2 pr-4">Recorded By</th>
                <th className="text-left py-2">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {tireReadings.filter(r => r.assetId === selectedAsset).map(r => {
                const ps = psiStatus(r.psi);
                const ts = treadStatus(r.treadDepth);
                return (
                  <tr key={r.id} className="text-slate-300 hover:bg-slate-800/40">
                    <td className="py-2 pr-4 font-mono text-[10px]">{r.axlePosition.replace(/_/g, ' ')}</td>
                    <td className="py-2 pr-4">{r.tireBrand}</td>
                    <td className={`py-2 pr-4 text-right font-bold ${statusColors[ps].split(' ')[0]}`}>{r.psi}</td>
                    <td className={`py-2 pr-4 text-right font-bold ${statusColors[ts].split(' ')[0]}`}>{r.treadDepth}/32"</td>
                    <td className="py-2 pr-4 text-slate-400">{r.recordedBy}</td>
                    <td className="py-2 text-slate-500">{new Date(r.recordedAt).toLocaleDateString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
