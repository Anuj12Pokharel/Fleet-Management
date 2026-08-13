'use client';
import React, { useState } from 'react';
import { Warranty, Asset, User as DbUser, getStore, setStore, initialWarranties } from '../mockDb';
import { Plus, Shield, AlertTriangle } from 'lucide-react';

interface Props {
  warranties: Warranty[];
  assets: Asset[];
  currentUser: DbUser;
  onRefresh: () => void;
}

const statusConfig: Record<string, { color: string; bg: string; border: string }> = {
  ACTIVE: { color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30' },
  EXPIRING_SOON: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  EXPIRED: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' },
  CLAIMED: { color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/30' },
};

function daysUntil(dateStr: string) {
  return Math.floor((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function coverageBar(start: string, expiry: string) {
  const total = new Date(expiry).getTime() - new Date(start).getTime();
  const elapsed = Date.now() - new Date(start).getTime();
  return Math.min(Math.max((elapsed / total) * 100, 0), 100);
}

export default function Warranties({ warranties, assets, currentUser, onRefresh }: Props) {
  const [assetFilter, setAssetFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Partial<Warranty>>({
    assetId: assets[0]?.id || '',
    componentName: '',
    provider: '',
    warrantyNumber: '',
    startDate: '',
    expiryDate: '',
    coverageDetails: '',
    status: 'ACTIVE',
  });

  const canManage = ['MAINTENANCE_ADMIN', 'FLEET_MANAGER'].includes(currentUser.role);

  const displayed = warranties
    .filter(w => assetFilter === 'ALL' || w.assetId === assetFilter)
    .filter(w => statusFilter === 'ALL' || w.status === statusFilter);

  const handleSubmit = () => {
    if (!form.componentName || !form.provider || !form.startDate || !form.expiryDate) {
      alert('Component, provider, and dates are required.'); return;
    }
    const days = daysUntil(form.expiryDate!);
    const status: Warranty['status'] = days < 0 ? 'EXPIRED' : days < 60 ? 'EXPIRING_SOON' : 'ACTIVE';
    const newW: Warranty = {
      id: 'war-' + Math.random().toString(36).substr(2, 8),
      assetId: form.assetId!,
      componentName: form.componentName!,
      provider: form.provider!,
      warrantyNumber: form.warrantyNumber || `WRN-${Math.round(Math.random() * 100000)}`,
      startDate: form.startDate!,
      expiryDate: form.expiryDate!,
      coverageDetails: form.coverageDetails || '',
      status,
    };
    const all = getStore('warranties', initialWarranties);
    all.unshift(newW);
    setStore('warranties', all);
    setShowForm(false);
    onRefresh();
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(statusConfig).map(([s, cfg]) => {
          const count = warranties.filter(w => w.status === s).length;
          return (
            <button key={s} onClick={() => setStatusFilter(s === statusFilter ? 'ALL' : s)}
              className={`bg-white border rounded-2xl p-4 text-center cursor-pointer transition shadow-xs ${statusFilter === s ? 'ring-2 ring-indigo-500 border-indigo-300' : 'border-slate-200'}`}>
              <p className={`text-2xl font-black ${cfg.color}`}>{count}</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{s.replace('_', ' ')}</p>
            </button>
          );
        })}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <select value={assetFilter} onChange={e => setAssetFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:border-indigo-600 shadow-xs">
            <option value="ALL">All Assets</option>
            {assets.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
        {canManage && (
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold text-white transition shadow-sm">
            <Plus className="h-3.5 w-3.5" /> Add Warranty
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 space-y-4">
          <h4 className="text-sm font-bold text-slate-900">Add New Warranty</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Asset</label>
              <select value={form.assetId} onChange={e => setForm(f => ({ ...f, assetId: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 font-medium">
                {assets.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            {[
              { label: 'Component Name', key: 'componentName', type: 'text', placeholder: 'e.g. Cummins X15 Engine' },
              { label: 'Provider', key: 'provider', type: 'text', placeholder: 'e.g. Cummins Inc.' },
              { label: 'Warranty #', key: 'warrantyNumber', type: 'text', placeholder: 'Auto-generated if blank' },
              { label: 'Start Date', key: 'startDate', type: 'date', placeholder: '' },
              { label: 'Expiry Date', key: 'expiryDate', type: 'date', placeholder: '' },
            ].map(({ label, key, type, placeholder }) => (
              <div key={key}>
                <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">{label}</label>
                <input type={type} value={(form as any)[key] || ''} placeholder={placeholder}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 font-medium" />
              </div>
            ))}
            <div className="md:col-span-3">
              <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Coverage Details</label>
              <textarea value={form.coverageDetails} onChange={e => setForm(f => ({ ...f, coverageDetails: e.target.value }))}
                rows={2} placeholder="What the warranty covers..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 resize-none font-medium" />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowForm(false)} className="px-3 py-1.5 bg-slate-100 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-200">Cancel</button>
            <button onClick={handleSubmit} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold text-white shadow-sm">Add Warranty</button>
          </div>
        </div>
      )}

      {/* Warranty Cards */}
      <div className="space-y-4">
        {displayed.map(w => {
          const asset = assets.find(a => a.id === w.assetId);
          const cfg = statusConfig[w.status];
          const days = daysUntil(w.expiryDate);
          const pct = coverageBar(w.startDate, w.expiryDate);
          return (
            <div key={w.id} className={`bg-white border rounded-2xl p-5 space-y-3 shadow-sm ${cfg.border}`}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <Shield className={`h-5 w-5 shrink-0 ${cfg.color}`} />
                  <div>
                    <p className="font-bold text-slate-100">{w.componentName}</p>
                    <p className="text-[10px] text-slate-400">{asset?.name} · {w.provider}</p>
                    <p className="text-[10px] font-mono text-slate-500">{w.warrantyNumber}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
                    {w.status.replace('_', ' ')}
                  </span>
                  <p className="text-[10px] text-slate-500 mt-1">
                    {days < 0 ? `Expired ${Math.abs(days)}d ago` : `${days}d remaining`}
                  </p>
                </div>
              </div>
              {/* Timeline bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>{w.startDate}</span>
                  <span>{w.expiryDate}</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div className={`h-2 rounded-full transition-all ${cfg.color.replace('text-', 'bg-')}`}
                    style={{ width: `${pct}%` }} />
                </div>
              </div>
              {w.coverageDetails && (
                <p className="text-[11px] text-slate-400">{w.coverageDetails}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
