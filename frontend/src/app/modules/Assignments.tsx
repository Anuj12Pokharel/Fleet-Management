'use client';
import React, { useState } from 'react';
import { VehicleAssignment, Asset, User as DbUser, getStore, setStore, initialAssignments } from '../mockDb';
import { Plus, CheckCircle, XCircle, Clock } from 'lucide-react';

interface Props {
  assignments: VehicleAssignment[];
  assets: Asset[];
  users: DbUser[];
  currentUser: DbUser;
  onRefresh: () => void;
}

export default function Assignments({ assignments, assets, users, currentUser, onRefresh }: Props) {
  const [tab, setTab] = useState<'ACTIVE' | 'HISTORY'>('ACTIVE');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ assetId: '', driverId: '', startDate: '', endDate: '', notes: '' });

  const drivers = users.filter(u => u.role === 'DRIVER');
  const canManage = ['MAINTENANCE_ADMIN', 'FLEET_MANAGER'].includes(currentUser.role);

  const statusIcon = (s: string) =>
    s === 'ACTIVE' ? <CheckCircle className="h-3.5 w-3.5 text-green-400" /> :
    s === 'CANCELLED' ? <XCircle className="h-3.5 w-3.5 text-red-400" /> :
    <Clock className="h-3.5 w-3.5 text-slate-400" />;

  const displayed = assignments.filter(a =>
    tab === 'ACTIVE' ? a.status === 'ACTIVE' :
    a.status === 'COMPLETED' || a.status === 'CANCELLED'
  );

  const myAssignments = currentUser.role === 'DRIVER'
    ? displayed.filter(a => a.driverId === currentUser.id)
    : displayed;

  const handleSubmit = () => {
    if (!form.assetId || !form.driverId || !form.startDate) {
      alert('Asset, driver, and start date are required.');
      return;
    }
    const driver = users.find(u => u.id === form.driverId);
    const newA: VehicleAssignment = {
      id: 'va-' + Math.random().toString(36).substr(2, 8),
      assetId: form.assetId,
      driverId: form.driverId,
      driverName: driver?.name || 'Unknown',
      startDate: form.startDate,
      endDate: form.endDate || null,
      notes: form.notes,
      status: 'ACTIVE'
    };
    const all = getStore('assignments', initialAssignments);
    all.unshift(newA);
    setStore('assignments', all);
    setShowForm(false);
    setForm({ assetId: '', driverId: '', startDate: '', endDate: '', notes: '' });
    onRefresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {(['ACTIVE', 'HISTORY'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${tab === t ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {t === 'ACTIVE' ? 'Active Assignments' : 'History'}
            </button>
          ))}
        </div>
        {canManage && (
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold text-white transition shadow-sm">
            <Plus className="h-3.5 w-3.5" /> Assign Driver
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 space-y-4">
          <h4 className="text-sm font-bold text-slate-900">New Driver Assignment</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Asset</label>
              <select value={form.assetId} onChange={e => setForm(f => ({ ...f, assetId: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 font-medium">
                <option value="">Select asset...</option>
                {assets.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Driver</label>
              <select value={form.driverId} onChange={e => setForm(f => ({ ...f, driverId: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 font-medium">
                <option value="">Select driver...</option>
                {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Start Date</label>
              <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 font-medium" />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">End Date (optional)</label>
              <input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 font-medium" />
            </div>
            <div className="md:col-span-2">
              <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Notes</label>
              <input type="text" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Route details, shift info..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 font-medium" />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition">Cancel</button>
            <button onClick={handleSubmit} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold text-white transition shadow-sm">Create Assignment</button>
          </div>
        </div>
      )}

      {myAssignments.length === 0 ? (
        <div className="text-center py-12 text-slate-500 text-sm font-medium">No {tab.toLowerCase()} assignments found.</div>
      ) : (
        <div className="space-y-3">
          {myAssignments.map(a => {
            const asset = assets.find(x => x.id === a.assetId);
            return (
              <div key={a.id} className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                    <span className="text-indigo-600 text-xs font-bold">{asset?.type === 'TRACTOR' ? '🚛' : '📦'}</span>
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-slate-900">{asset?.name || a.assetId}</p>
                    <p className="text-xs text-slate-500 font-medium">Driver: <span className="text-slate-800 font-bold">{a.driverName}</span></p>
                    {a.notes && <p className="text-xs text-slate-500 italic mt-0.5">{a.notes}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-6 text-xs text-slate-500 font-medium">
                  <div>
                    <p className="font-bold text-slate-700">Start</p>
                    <p>{a.startDate}</p>
                  </div>
                  {a.endDate && (
                    <div>
                      <p className="font-bold text-slate-700">End</p>
                      <p>{a.endDate}</p>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 font-bold">
                    {statusIcon(a.status)}
                    <span className={a.status === 'ACTIVE' ? 'text-green-700' : 'text-slate-600'}>{a.status}</span>
                  </div>
                  {canManage && a.status === 'ACTIVE' && (
                    <button
                      onClick={() => {
                        const all = getStore('assignments', initialAssignments);
                        const updated = all.map(x => x.id === a.id ? { ...x, status: 'COMPLETED' as const } : x);
                        setStore('assignments', updated);
                        onRefresh();
                      }}
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-[10px] font-bold rounded-lg transition"
                    >
                      End Shift
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
