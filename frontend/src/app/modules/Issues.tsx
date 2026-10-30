'use client';
import React, { useState } from 'react';
import {
  Issue,
  Asset,
  IssuePriorityConfig,
  FaultRuleConfig,
  User as DbUser,
  getStore,
  setStore,
  initialIssuePriorities,
  initialFaultRules
} from '../mockDb';
import { apiCreateIssue, apiUpdateIssue } from '../lib/api-client';
import {
  Plus,
  AlertTriangle,
  CheckCircle,
  Clock,
  Search,
  Radio,
  Sliders,
  SlidersHorizontal,
  Trash2,
  Zap,
  Layers
} from 'lucide-react';

interface Props {
  issues: Issue[];
  assets: Asset[];
  currentUser: DbUser;
  onRefresh: () => void;
}

const severityColors: Record<string, string> = {
  LOW: 'bg-slate-50 text-slate-700 border-slate-200',
  MEDIUM: 'bg-amber-50 text-amber-700 border-amber-200',
  HIGH: 'bg-orange-50 text-orange-700 border-orange-200',
  CRITICAL: 'bg-rose-50 text-rose-700 border-rose-200',
};

const statusConfig: Record<string, { icon: React.ReactNode; color: string }> = {
  OPEN: { icon: <AlertTriangle className="h-3.5 w-3.5" />, color: 'text-rose-600' },
  INVESTIGATING: { icon: <Clock className="h-3.5 w-3.5" />, color: 'text-amber-600' },
  RESOLVED: { icon: <CheckCircle className="h-3.5 w-3.5" />, color: 'text-emerald-700' },
};

export default function Issues({ issues, assets, currentUser, onRefresh }: Props) {
  const [activeSubTab, setActiveSubTab] = useState<'issues' | 'priorities' | 'faultrules'>('issues');

  // Sub-tab stores
  const [priorities, setPriorities] = useState<IssuePriorityConfig[]>(() => getStore('issuePriorities', initialIssuePriorities));
  const [faultRules, setFaultRules] = useState<FaultRuleConfig[]>(() => getStore('faultRules', initialFaultRules));

  // Issues filters
  const [filter, setFilter] = useState<'ALL' | 'OPEN' | 'INVESTIGATING' | 'RESOLVED'>('ALL');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    assetId: assets[0]?.id || '',
    title: '',
    description: '',
    severity: 'MEDIUM' as Issue['severity'],
  });

  // Modals for subtabs
  const [addPriorityModal, setAddPriorityModal] = useState(false);
  const [priorityForm, setPriorityForm] = useState({ name: '', slaHours: 24, color: 'text-[#00BA7C] bg-emerald-50 border-emerald-200', autoEscalate: true });

  const [addRuleModal, setAddRuleModal] = useState(false);
  const [ruleForm, setRuleForm] = useState({
    source: 'Motive',
    codePattern: 'SPN ',
    severity: 'HIGH' as FaultRuleConfig['severity'],
    action: 'AUTO_WORK_ORDER' as FaultRuleConfig['action']
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.description) { alert('Title and description are required.'); return; }
    try {
      await apiCreateIssue({
        assetId: form.assetId,
        reportedBy: currentUser.name,
        title: form.title,
        description: form.description,
        severity: form.severity,
        status: 'OPEN',
      });
      setShowForm(false);
      setForm({ assetId: assets[0]?.id || '', title: '', description: '', severity: 'MEDIUM' });
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to create issue in database');
    }
  };

  const updateStatus = async (id: string, status: Issue['status']) => {
    try {
      await apiUpdateIssue(id, { status });
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to update issue status');
    }
  };

  // Subtab handlers
  const handleAddPriority = (e: React.FormEvent) => {
    e.preventDefault();
    if (!priorityForm.name) return;
    const newP: IssuePriorityConfig = {
      id: 'ip-' + Math.random().toString(36).substr(2, 8),
      name: priorityForm.name,
      slaHours: Number(priorityForm.slaHours) || 24,
      color: priorityForm.color,
      autoEscalate: priorityForm.autoEscalate
    };
    const updated = [...priorities, newP];
    setStore('issuePriorities', updated);
    setPriorities(updated);
    setAddPriorityModal(false);
    setPriorityForm({ name: '', slaHours: 24, color: 'text-[#00BA7C] bg-emerald-50 border-emerald-200', autoEscalate: true });
  };

  const handleAddFaultRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleForm.codePattern) return;
    const newR: FaultRuleConfig = {
      id: 'fr-' + Math.random().toString(36).substr(2, 8),
      source: ruleForm.source,
      codePattern: ruleForm.codePattern,
      severity: ruleForm.severity,
      action: ruleForm.action,
      enabled: true
    };
    const updated = [...faultRules, newR];
    setStore('faultRules', updated);
    setFaultRules(updated);
    setAddRuleModal(false);
    setRuleForm({ source: 'Motive', codePattern: 'SPN ', severity: 'HIGH', action: 'AUTO_WORK_ORDER' });
  };

  const handleToggleFaultRule = (id: string) => {
    const updated = faultRules.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r);
    setStore('faultRules', updated);
    setFaultRules(updated);
  };

  const displayed = issues
    .filter(i => filter === 'ALL' || i.status === filter)
    .filter(i => !search || i.title.toLowerCase().includes(search.toLowerCase()) || i.description.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Navigation Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2.5">
            <AlertTriangle className="h-6 w-6 text-[#00BA7C]" />
            Issues & Fault Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Driver defect reporting, priority SLA resolution metrics, and telematics J1939/OBD DTC automation rules.
          </p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
          <button
            onClick={() => setActiveSubTab('issues')}
            className={`px-3 py-1.5 rounded-lg transition ${activeSubTab === 'issues' ? 'bg-white text-[#00BA7C] shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Issues List
          </button>
          {['MAINTENANCE_ADMIN', 'FLEET_MANAGER'].includes(currentUser.role) && (
            <>
              <button
                onClick={() => setActiveSubTab('priorities')}
                className={`px-3 py-1.5 rounded-lg transition ${activeSubTab === 'priorities' ? 'bg-white text-[#00BA7C] shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Issue Priorities
              </button>
              <button
                onClick={() => setActiveSubTab('faultrules')}
                className={`px-3 py-1.5 rounded-lg transition ${activeSubTab === 'faultrules' ? 'bg-white text-[#00BA7C] shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Fault Rules
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── SUBTAB 1: ISSUES LIST ── */}
      {activeSubTab === 'issues' && (
        <div className="space-y-6">
          {/* Stats KPI */}
          <div className="grid grid-cols-3 gap-4">
            {(['OPEN', 'INVESTIGATING', 'RESOLVED'] as const).map(s => {
              const count = issues.filter(i => i.status === s).length;
              const cfg = statusConfig[s];
              return (
                <button
                  key={s}
                  onClick={() => setFilter(s === filter ? 'ALL' : s)}
                  className={`bg-white border rounded-2xl p-4 text-center transition cursor-pointer shadow-sm ${filter === s ? 'ring-2 ring-[#00BA7C] border-emerald-300' : 'border-slate-200'}`}
                >
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
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search issues..."
                className="pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#00BA7C] w-64"
              />
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-4 py-2 bg-[#00BA7C] hover:bg-[#00BA7C] text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" /> {showForm ? 'Cancel' : 'Report New Issue'}
            </button>
          </div>

          {/* Add Issue Form */}
          {showForm && (
            <form onSubmit={handleSubmit} className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-slate-900">Report Fleet Issue</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Vehicle / Asset</label>
                  <select
                    value={form.assetId}
                    onChange={e => setForm({ ...form, assetId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900 font-bold"
                  >
                    {assets.map(a => (
                      <option key={a.id} value={a.id}>{a.name} ({a.plateNumber})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Issue Severity</label>
                  <select
                    value={form.severity}
                    onChange={e => setForm({ ...form, severity: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900 font-bold"
                  >
                    <option value="LOW">Low - Minor cosmetic / non-urgent</option>
                    <option value="MEDIUM">Medium - Service soon</option>
                    <option value="HIGH">High - Urgent repair needed</option>
                    <option value="CRITICAL">Critical - Immediate safety lockdown</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Issue Title / Summary</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Brake warning light intermittently flickering"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Detailed Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  placeholder="Describe the issue, symptoms, and when it occurs..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-100 text-xs font-bold rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-[#00BA7C] text-white text-xs font-bold rounded-lg shadow-sm">Submit Issue</button>
              </div>
            </form>
          )}

          {/* Issues Cards List */}
          <div className="space-y-3">
            {displayed.map(issue => {
              const asset = assets.find(a => a.id === issue.assetId);
              return (
                <div key={issue.id} className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase ${severityColors[issue.severity]}`}>
                          {issue.severity}
                        </span>
                        <span className="text-xs font-bold text-slate-900">{asset?.name}</span>
                        <span className="text-[11px] text-slate-400 font-mono">&bull; Reported by {issue.reportedBy}</span>
                      </div>
                      <h3 className="font-bold text-sm text-slate-900">{issue.title}</h3>
                      <p className="text-xs text-slate-600 mt-1">{issue.description}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      {['MECHANIC', 'MAINTENANCE_ADMIN', 'FLEET_MANAGER'].includes(currentUser.role) ? (
                        <select
                          value={issue.status}
                          onChange={e => updateStatus(issue.id, e.target.value as any)}
                          className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800"
                        >
                          <option value="OPEN">OPEN</option>
                          <option value="INVESTIGATING">INVESTIGATING</option>
                          <option value="RESOLVED">RESOLVED</option>
                        </select>
                      ) : (
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                          issue.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          issue.status === 'INVESTIGATING' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {issue.status}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── SUBTAB 2: ISSUE PRIORITIES ── */}
      {activeSubTab === 'priorities' && (
        <div className="space-y-4 max-w-4xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Issue Priorities & SLA Turnarounds</h2>
              <p className="text-xs text-slate-500">Configure response SLA timelines and escalation policies for defect categories.</p>
            </div>
            <button
              onClick={() => setAddPriorityModal(true)}
              className="px-4 py-2 bg-[#00BA7C] hover:bg-[#00BA7C] text-white text-xs font-bold rounded-xl transition flex items-center gap-1"
            >
              <Plus className="h-3.5 w-3.5" /> Add Priority Level
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {priorities.map(p => (
              <div key={p.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
                <div className="flex justify-between items-center">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${p.color}`}>
                    {p.name}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-900">
                    {p.slaHours}h SLA Turnaround
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Auto-Escalate to Fleet Manager: <strong className="text-slate-800">{p.autoEscalate ? 'Enabled (Alert on breach)' : 'Disabled'}</strong>
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── SUBTAB 3: FAULT RULES ── */}
      {activeSubTab === 'faultrules' && (
        <div className="space-y-4 max-w-4xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Telematics DTC Ingestion Rules</h2>
              <p className="text-xs text-slate-500">Automatically generate work orders or notify supervisors when J1939 fault codes stream in.</p>
            </div>
            <button
              onClick={() => setAddRuleModal(true)}
              className="px-4 py-2 bg-[#00BA7C] hover:bg-[#00BA7C] text-white text-xs font-bold rounded-xl transition flex items-center gap-1"
            >
              <Plus className="h-3.5 w-3.5" /> Add Fault Rule
            </button>
          </div>

          <div className="space-y-3">
            {faultRules.map(rule => (
              <div key={rule.id} className="p-4 bg-white border border-slate-200 rounded-xl flex justify-between items-center shadow-sm">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-slate-900">{rule.codePattern}</span>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded">
                      {rule.source}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${severityColors[rule.severity]}`}>
                      {rule.severity}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Action: <strong className="text-[#00BA7C] font-mono">{rule.action.replace('_', ' ')}</strong></p>
                </div>
                <div className="flex items-center gap-3">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rule.enabled}
                      onChange={() => handleToggleFaultRule(rule.id)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#00BA7C]"></div>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── MODALS ── */}

      {/* 1. ADD PRIORITY MODAL */}
      {addPriorityModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-slate-900">Add Priority SLA Level</h3>
            <form onSubmit={handleAddPriority} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Priority Name</label>
                <input
                  type="text"
                  value={priorityForm.name}
                  onChange={e => setPriorityForm({ ...priorityForm, name: e.target.value })}
                  required
                  placeholder="e.g. Expedited Linehaul"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">SLA Turnaround (Hours)</label>
                <input
                  type="number"
                  value={priorityForm.slaHours}
                  onChange={e => setPriorityForm({ ...priorityForm, slaHours: parseInt(e.target.value) || 24 })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900"
                />
              </div>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="escCheck"
                  checked={priorityForm.autoEscalate}
                  onChange={e => setPriorityForm({ ...priorityForm, autoEscalate: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-[#00BA7C]"
                />
                <label htmlFor="escCheck" className="text-xs text-slate-700 font-medium">Auto-escalate when SLA is breached</label>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setAddPriorityModal(false)} className="px-3 py-1.5 bg-slate-100 text-xs font-bold rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-[#00BA7C] text-white text-xs font-bold rounded-lg">Save Priority</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. ADD FAULT RULE MODAL */}
      {addRuleModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-slate-900">Add DTC Telematics Fault Rule</h3>
            <form onSubmit={handleAddFaultRule} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Telematics Source</label>
                <select
                  value={ruleForm.source}
                  onChange={e => setRuleForm({ ...ruleForm, source: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900 font-bold"
                >
                  <option value="Motive">Motive (KeepTruckin)</option>
                  <option value="Samsara">Samsara ELD</option>
                  <option value="Geotab">Geotab Gateway</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Code Pattern / Wildcard</label>
                <input
                  type="text"
                  value={ruleForm.codePattern}
                  onChange={e => setRuleForm({ ...ruleForm, codePattern: e.target.value })}
                  required
                  placeholder="e.g. SPN 110* or DTC P0128"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900 font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Trigger Action</label>
                <select
                  value={ruleForm.action}
                  onChange={e => setRuleForm({ ...ruleForm, action: e.target.value as any })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900 font-bold"
                >
                  <option value="AUTO_WORK_ORDER">Auto-Create High Priority Work Order</option>
                  <option value="CREATE_ISSUE">Create Open Defect Issue</option>
                  <option value="NOTIFY_ONLY">Send Live Push Notification Only</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setAddRuleModal(false)} className="px-3 py-1.5 bg-slate-100 text-xs font-bold rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-[#00BA7C] text-white text-xs font-bold rounded-lg">Save Fault Rule</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
