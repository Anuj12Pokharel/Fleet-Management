'use client';
import React, { useState } from 'react';
import { Issue, Asset, User as DbUser, getStore, setStore, initialIssues, mutators } from '../mockDb';
import { Plus, AlertTriangle, CheckCircle, Clock, Search } from 'lucide-react';

interface Props {
  issues: Issue[];
  assets: Asset[];
  currentUser: DbUser;
  onRefresh: () => void;
}

const severityColors: Record<string, string> = {
  LOW: 'bg-slate-700 text-slate-300',
  MEDIUM: 'bg-amber-500/20 text-amber-300',
  HIGH: 'bg-orange-500/20 text-orange-300',
  CRITICAL: 'bg-red-500/20 text-red-300',
};

const statusConfig: Record<string, { icon: React.ReactNode; color: string }> = {
  OPEN: { icon: <AlertTriangle className="h-3.5 w-3.5" />, color: 'text-red-400' },
  INVESTIGATING: { icon: <Clock className="h-3.5 w-3.5" />, color: 'text-amber-400' },
  RESOLVED: { icon: <CheckCircle className="h-3.5 w-3.5" />, color: 'text-green-400' },
};

export default function Issues({ issues, assets, currentUser, onRefresh }: Props) {
  const [filter, setFilter] = useState<'ALL' | 'OPEN' | 'INVESTIGATING' | 'RESOLVED'>('ALL');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    assetId: assets[0]?.id || '',
    title: '',
    description: '',
    severity: 'MEDIUM' as Issue['severity'],
  });

  const handleSubmit = () => {
    if (!form.title || !form.description) { alert('Title and description are required.'); return; }
    const newIssue: Issue = {
      id: 'iss-' + Math.random().toString(36).substr(2, 8),
      assetId: form.assetId,
      reportedBy: currentUser.name,
      title: form.title,
      description: form.description,
      severity: form.severity,
      status: 'OPEN',
      createdAt: new Date().toISOString(),
      resolvedAt: null,
      linkedWoId: null,
    };
    const all = getStore('issues', initialIssues);
    all.unshift(newIssue);
    setStore('issues', all);
    mutators.addNotification('WORK_ORDER', `New Issue: ${form.title}`, `Reported by ${currentUser.name} on ${assets.find(a => a.id === form.assetId)?.name}`);
    mutators.logAudit(currentUser.name, 'CREATE', 'Issue', newIssue.id);
    setShowForm(false);
    setForm({ assetId: assets[0]?.id || '', title: '', description: '', severity: 'MEDIUM' });
    onRefresh();
  };

  const updateStatus = (id: string, status: Issue['status']) => {
    const all = getStore('issues', initialIssues);
    const updated = all.map(i => i.id === id ? {
      ...i,
      status,
      resolvedAt: status === 'RESOLVED' ? new Date().toISOString() : i.resolvedAt
    } : i);
    setStore('issues', updated);
    mutators.logAudit(currentUser.name, 'UPDATE', 'Issue', id);
    onRefresh();
  };

  const displayed = issues
    .filter(i => filter === 'ALL' || i.status === filter)
    .filter(i => !search || i.title.toLowerCase().includes(search.toLowerCase()) || i.description.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {(['OPEN', 'INVESTIGATING', 'RESOLVED'] as const).map(s => {
          const count = issues.filter(i => i.status === s).length;
          const cfg = statusConfig[s];
          return (
            <button key={s} onClick={() => setFilter(s === filter ? 'ALL' : s)}
              className={`bg-white border rounded-2xl p-4 text-center transition cursor-pointer shadow-sm ${filter === s ? 'ring-2 ring-indigo-500 border-indigo-300' : 'border-slate-200'}`}>
              <div className={`flex justify-center mb-1 ${cfg.color}`}>{cfg.icon}</div>
              <p className={`text-2xl font-black ${cfg.color}`}>{count}</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{s}</p>
            </button>
          );
        })}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search issues..."
            className="bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 font-medium w-56 shadow-xs" />
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold text-white transition shadow-sm">
          <Plus className="h-3.5 w-3.5" /> Report Issue
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 space-y-4">
          <h4 className="text-sm font-bold text-slate-900">Report New Issue</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Asset</label>
              <select value={form.assetId} onChange={e => setForm(f => ({ ...f, assetId: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 font-medium">
                {assets.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Severity</label>
              <select value={form.severity} onChange={e => setForm(f => ({ ...f, severity: e.target.value as any }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 font-medium">
                {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as Issue['severity'][]).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Title</label>
              <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Brief issue title..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 font-medium" />
            </div>
            <div className="md:col-span-3">
              <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Description</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={2} placeholder="Detailed description of the issue..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 resize-none font-medium" />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowForm(false)} className="px-3 py-1.5 bg-slate-100 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-200">Cancel</button>
            <button onClick={handleSubmit} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold text-white shadow-sm">Submit Issue</button>
          </div>
        </div>
      )}

      {/* Issues List */}
      {displayed.length === 0 ? (
        <div className="text-center py-12 text-slate-500 text-sm font-medium">No issues found matching current filters.</div>
      ) : (
        <div className="space-y-3">
          {displayed.map(issue => {
            const asset = assets.find(a => a.id === issue.assetId);
            const cfg = statusConfig[issue.status];
            const daysSince = Math.floor((Date.now() - new Date(issue.createdAt).getTime()) / (1000 * 60 * 60 * 24));
            return (
              <div key={issue.id} className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${severityColors[issue.severity]}`}>
                        {issue.severity}
                      </span>
                      <span className={`flex items-center gap-1 text-[10px] font-bold ${cfg.color}`}>
                        {cfg.icon} {issue.status}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">{daysSince}d ago</span>
                    </div>
                    <p className="font-extrabold text-slate-900 text-sm">{issue.title}</p>
                    <p className="text-xs text-slate-600 mt-0.5 font-medium">{issue.description}</p>
                    <p className="text-[10px] text-slate-500 mt-1 font-semibold">
                      {asset?.name} · Reported by {issue.reportedBy}
                    </p>
                  </div>
                  {['MAINTENANCE_ADMIN', 'FLEET_MANAGER', 'MECHANIC'].includes(currentUser.role) && issue.status !== 'RESOLVED' && (
                    <div className="flex gap-2 shrink-0">
                      {issue.status === 'OPEN' && (
                        <button onClick={() => updateStatus(issue.id, 'INVESTIGATING')}
                          className="px-3 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 rounded-xl text-[10px] font-bold transition">
                          Investigate
                        </button>
                      )}
                      <button onClick={() => updateStatus(issue.id, 'RESOLVED')}
                        className="px-3 py-1 bg-green-50 hover:bg-green-100 border border-green-200 text-green-700 rounded-xl text-[10px] font-bold transition">
                        Resolve
                      </button>
                    </div>
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
