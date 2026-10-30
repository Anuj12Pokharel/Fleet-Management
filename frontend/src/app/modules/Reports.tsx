'use client';
import React, { useState } from 'react';
import {
  Asset,
  FuelLog,
  WorkOrder,
  EDVIRInspection,
  PMSchedule,
  DOTInspection,
  Part,
  SavedReportConfig,
  getStore,
  setStore,
  initialSavedReports
} from '../mockDb';
import {
  Download,
  FileText,
  Printer,
  BarChart3,
  Calendar,
  Mail,
  Plus,
  Trash2,
  Play,
  CheckCircle,
  Clock,
  Layers
} from 'lucide-react';

interface Props {
  assets: Asset[];
  fuelLogs: FuelLog[];
  workOrders: WorkOrder[];
  inspections: EDVIRInspection[];
  pmSchedules: PMSchedule[];
  dotInspections: DOTInspection[];
  parts: Part[];
}

type ReportType = 'fuel' | 'pm' | 'inspection' | 'downtime' | 'cpm' | 'dot' | 'parts';

const REPORTS: { id: ReportType; title: string; desc: string; icon: string }[] = [
  { id: 'fuel', title: 'Fuel Consumption Report', desc: 'Gallons, cost, MPG by asset', icon: '⛽' },
  { id: 'pm', title: 'PM Compliance Report', desc: 'Schedule status by asset and template', icon: '🔧' },
  { id: 'inspection', title: 'Inspection Summary', desc: 'eDVIR pass/fail history', icon: '📋' },
  { id: 'downtime', title: 'Fleet Downtime Log', desc: 'WO-based downtime cost analysis', icon: '⏱️' },
  { id: 'cpm', title: 'Cost Per Mile by Asset', desc: 'Total cost ÷ odometer per asset', icon: '💰' },
  { id: 'dot', title: 'DOT Inspection History', desc: 'Federal roadside inspection results', icon: '🚔' },
  { id: 'parts', title: 'Parts Usage Report', desc: 'Parts catalog with stock levels', icon: '📦' },
];

function exportCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Reports({ assets, fuelLogs, workOrders, inspections, pmSchedules, dotInspections, parts }: Props) {
  const [activeSubTab, setActiveSubTab] = useState<'analytics' | 'saved'>('analytics');
  const [activeReport, setActiveReport] = useState<ReportType | null>(null);

  // Saved Reports Store
  const [savedReports, setSavedReports] = useState<SavedReportConfig[]>(() => getStore('savedReports', initialSavedReports));
  const [addReportModal, setAddReportModal] = useState(false);
  const [reportForm, setReportForm] = useState({
    title: '',
    category: 'IFTA' as SavedReportConfig['category'],
    schedule: 'WEEKLY' as SavedReportConfig['schedule'],
    recipients: '',
    format: 'CSV' as SavedReportConfig['format']
  });

  const handleAddSavedReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportForm.title) return;
    const newR: SavedReportConfig = {
      id: 'sr-' + Math.random().toString(36).substr(2, 8),
      title: reportForm.title,
      category: reportForm.category,
      schedule: reportForm.schedule,
      recipients: reportForm.recipients || 'admin@fleet.com',
      lastRun: new Date().toISOString().split('T')[0],
      format: reportForm.format
    };
    const updated = [...savedReports, newR];
    setStore('savedReports', updated);
    setSavedReports(updated);
    setAddReportModal(false);
    setReportForm({ title: '', category: 'IFTA', schedule: 'WEEKLY', recipients: '', format: 'CSV' });
  };

  const handleDeleteSavedReport = (id: string) => {
    const updated = savedReports.filter(r => r.id !== id);
    setStore('savedReports', updated);
    setSavedReports(updated);
  };

  const handleRunNow = (r: SavedReportConfig) => {
    exportCsv(
      `${r.title.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.${r.format.toLowerCase()}`,
      ['Report Name', 'Category', 'Generated Date', 'Status'],
      [[r.title, r.category, new Date().toISOString(), 'Completed Successfully']]
    );
  };

  const renderReport = () => {
    if (!activeReport) return null;

    if (activeReport === 'fuel') {
      const byAsset = assets.map(a => {
        const logs = fuelLogs.filter(f => f.assetId === a.id);
        const totalGal = logs.reduce((s, f) => s + f.gallons, 0);
        const totalCost = logs.reduce((s, f) => s + f.cost, 0);
        const avgMpg = logs.length > 0 ? (logs.reduce((s, f) => s + f.mpg, 0) / logs.length).toFixed(2) : 'N/A';
        const anomalies = logs.filter(f => f.isAnomaly).length;
        return { asset: a.name, transactions: logs.length, gallons: totalGal, cost: totalCost, avgMpg, anomalies };
      });
      return {
        headers: ['Asset', 'Transactions', 'Total Gallons', 'Total Cost', 'Avg MPG', 'Anomalies'],
        rows: byAsset.map(r => [r.asset, r.transactions, r.gallons, `$${r.cost.toFixed(2)}`, r.avgMpg, r.anomalies]),
        render: () => byAsset.map((r, i) => (
          <tr key={i} className="hover:bg-slate-50">
            <td className="px-4 py-3 font-semibold text-slate-900">{r.asset}</td>
            <td className="px-4 py-3 text-center">{r.transactions}</td>
            <td className="px-4 py-3 text-right font-mono">{r.gallons.toFixed(1)} gal</td>
            <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">${r.cost.toFixed(2)}</td>
            <td className="px-4 py-3 text-center font-mono">{r.avgMpg}</td>
            <td className="px-4 py-3 text-center">
              {r.anomalies > 0 ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                  {r.anomalies} flag(s)
                </span>
              ) : (
                <span className="text-emerald-700 font-bold">0</span>
              )}
            </td>
          </tr>
        ))
      };
    }

    if (activeReport === 'pm') {
      const rows = pmSchedules.map(s => {
        const a = assets.find(x => x.id === s.assetId);
        return { asset: a?.name || s.assetId, template: s.templateId, lastOdo: s.lastServiceOdometer, nextOdo: s.nextDueOdometer, dueDate: s.nextDueDate, status: s.status };
      });
      return {
        headers: ['Asset', 'PM Template', 'Last Service Odo', 'Next Due Odo', 'Next Due Date', 'Status'],
        rows: rows.map(r => [r.asset, r.template, r.lastOdo, r.nextOdo, r.dueDate, r.status]),
        render: () => rows.map((r, i) => (
          <tr key={i} className="hover:bg-slate-50">
            <td className="px-4 py-3 font-semibold text-slate-900">{r.asset}</td>
            <td className="px-4 py-3 font-mono">{r.template}</td>
            <td className="px-4 py-3 text-right font-mono">{r.lastOdo.toLocaleString()} mi</td>
            <td className="px-4 py-3 text-right font-mono">{r.nextOdo.toLocaleString()} mi</td>
            <td className="px-4 py-3 font-mono">{r.dueDate}</td>
            <td className="px-4 py-3">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${r.status === 'COMPLIANT' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                {r.status}
              </span>
            </td>
          </tr>
        ))
      };
    }

    if (activeReport === 'inspection') {
      return {
        headers: ['Inspection ID', 'Asset', 'Driver', 'Odometer', 'Result', 'Date'],
        rows: inspections.map(ins => [
          ins.id,
          assets.find(a => a.id === ins.assetId)?.name || ins.assetId,
          ins.driverName,
          ins.odometer,
          ins.status,
          ins.createdAt.split('T')[0]
        ]),
        render: () => inspections.map(ins => {
          const a = assets.find(x => x.id === ins.assetId);
          return (
            <tr key={ins.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-mono text-slate-500">{ins.id}</td>
              <td className="px-4 py-3 font-semibold text-slate-900">{a?.name || ins.assetId}</td>
              <td className="px-4 py-3">{ins.driverName}</td>
              <td className="px-4 py-3 text-right font-mono">{ins.odometer.toLocaleString()} mi</td>
              <td className="px-4 py-3">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${ins.status === 'PASSED' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                  {ins.status}
                </span>
              </td>
              <td className="px-4 py-3 font-mono text-slate-500">{ins.createdAt.split('T')[0]}</td>
            </tr>
          );
        })
      };
    }

    if (activeReport === 'downtime') {
      const rows = workOrders.map(w => {
        const a = assets.find(x => x.id === w.assetId);
        return { woId: w.id, asset: a?.name || w.assetId, desc: w.description, priority: w.priority, status: w.status, totalCost: w.totalCost };
      });
      return {
        headers: ['Work Order', 'Asset', 'Description', 'Priority', 'Status', 'Cost'],
        rows: rows.map(r => [r.woId, r.asset, r.desc, r.priority, r.status, `$${r.totalCost}`]),
        render: () => rows.map((r, i) => (
          <tr key={i} className="hover:bg-slate-50">
            <td className="px-4 py-3 font-mono font-bold text-slate-900">{r.woId}</td>
            <td className="px-4 py-3">{r.asset}</td>
            <td className="px-4 py-3 text-slate-600 max-w-xs truncate">{r.desc}</td>
            <td className="px-4 py-3 font-semibold">{r.priority}</td>
            <td className="px-4 py-3">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${r.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                {r.status}
              </span>
            </td>
            <td className="px-4 py-3 font-mono font-bold text-slate-900">${r.totalCost.toFixed(2)}</td>
          </tr>
        ))
      };
    }

    if (activeReport === 'cpm') {
      const rows = assets.map(a => {
        const wos = workOrders.filter(w => w.assetId === a.id);
        const maintCost = wos.reduce((s, w) => s + w.totalCost, 0);
        const fuels = fuelLogs.filter(f => f.assetId === a.id);
        const fuelCost = fuels.reduce((s, f) => s + f.cost, 0);
        const total = maintCost + fuelCost;
        const cpm = a.odometer > 0 ? (total / a.odometer).toFixed(3) : '0.000';
        return { asset: a.name, odo: a.odometer, maintCost, fuelCost, total, cpm };
      });
      return {
        headers: ['Asset', 'Current Odometer', 'Maintenance Cost', 'Fuel Cost', 'Total Operating Cost', 'Cost Per Mile'],
        rows: rows.map(r => [r.asset, r.odo, `$${r.maintCost}`, `$${r.fuelCost}`, `$${r.total}`, `$${r.cpm}/mi`]),
        render: () => rows.map((r, i) => (
          <tr key={i} className="hover:bg-slate-50">
            <td className="px-4 py-3 font-semibold text-slate-900">{r.asset}</td>
            <td className="px-4 py-3 font-mono">{r.odo.toLocaleString()} mi</td>
            <td className="px-4 py-3 font-mono">${r.maintCost.toFixed(2)}</td>
            <td className="px-4 py-3 font-mono">${r.fuelCost.toFixed(2)}</td>
            <td className="px-4 py-3 font-mono font-bold text-slate-900">${r.total.toFixed(2)}</td>
            <td className="px-4 py-3 font-mono font-black text-[#00BA7C]">${r.cpm} / mi</td>
          </tr>
        ))
      };
    }

    if (activeReport === 'dot') {
      return {
        headers: ['Inspection ID', 'Asset', 'Date', 'Result', 'Violations Details'],
        rows: dotInspections.map(d => [
          d.id,
          assets.find(a => a.id === d.assetId)?.name || d.assetId,
          d.inspectionDate,
          d.result,
          d.violationsJson.join('; ') || 'None'
        ]),
        render: () => dotInspections.map(d => {
          const a = assets.find(x => x.id === d.assetId);
          return (
            <tr key={d.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-mono text-slate-500">{d.id}</td>
              <td className="px-4 py-3 font-semibold text-slate-900">{a?.name || d.assetId}</td>
              <td className="px-4 py-3 font-mono">{d.inspectionDate}</td>
              <td className="px-4 py-3">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${d.result === 'CLEAN' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                  {d.result}
                </span>
              </td>
              <td className="px-4 py-3 text-slate-600">{d.violationsJson.join(', ') || 'No infractions recorded.'}</td>
            </tr>
          );
        })
      };
    }

    if (activeReport === 'parts') {
      return {
        headers: ['Part Number', 'Name', 'Category', 'Stock Qty', 'Reorder Level', 'Unit Cost', 'Bin Location'],
        rows: parts.map(p => [p.partNumber, p.name, p.category, p.stockQty, p.reorderLevel, `$${p.unitCost}`, p.location]),
        render: () => parts.map(p => (
          <tr key={p.id} className="hover:bg-slate-50">
            <td className="px-4 py-3 font-mono font-bold text-slate-900">{p.partNumber}</td>
            <td className="px-4 py-3">{p.name}</td>
            <td className="px-4 py-3 font-semibold text-slate-700">{p.category}</td>
            <td className="px-4 py-3 text-center font-mono font-bold text-slate-900">{p.stockQty}</td>
            <td className="px-4 py-3 text-center text-slate-500 font-mono">{p.reorderLevel}</td>
            <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">${p.unitCost.toFixed(2)}</td>
            <td className="px-4 py-3 font-mono text-slate-500">{p.location}</td>
          </tr>
        ))
      };
    }

    return null;
  };

  const report = renderReport();
  const activeReportMeta = REPORTS.find(r => r.id === activeReport);

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header & Sub-Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2.5">
            <BarChart3 className="h-6 w-6 text-[#00BA7C]" />
            Reports & Scheduled Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time fleet financial rollups, compliance audits, IFTA tax reports, and automated scheduled deliveries.
          </p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
          <button
            onClick={() => setActiveSubTab('analytics')}
            className={`px-3 py-1.5 rounded-lg transition ${activeSubTab === 'analytics' ? 'bg-white text-[#00BA7C] shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Analytics & Reports
          </button>
          <button
            onClick={() => setActiveSubTab('saved')}
            className={`px-3 py-1.5 rounded-lg transition ${activeSubTab === 'saved' ? 'bg-white text-[#00BA7C] shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Saved Reports & Schedules
          </button>
        </div>
      </div>

      {/* ── SUBTAB 1: ANALYTICS & EXPORTS ── */}
      {activeSubTab === 'analytics' && (
        <div className="space-y-6">
          {/* Report Tiles Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {REPORTS.map(r => (
              <button
                key={r.id}
                onClick={() => setActiveReport(r.id === activeReport ? null : r.id)}
                className={`text-left p-4 rounded-2xl border transition cursor-pointer shadow-sm ${
                  activeReport === r.id
                    ? 'bg-emerald-50 border-emerald-300 ring-2 ring-[#00BA7C]'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="text-2xl mb-2">{r.icon}</div>
                <p className="text-sm font-extrabold text-slate-900">{r.title}</p>
                <p className="text-[10px] text-slate-500 mt-0.5 font-medium">{r.desc}</p>
              </button>
            ))}
          </div>

          {/* Active Report Table */}
          {report && activeReportMeta && (
            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{activeReportMeta.icon}</span>
                  <div>
                    <h3 className="font-extrabold text-slate-900">{activeReportMeta.title}</h3>
                    <p className="text-[10px] text-slate-500 font-medium">{activeReportMeta.desc}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition"
                  >
                    <Printer className="h-3.5 w-3.5" /> Print
                  </button>
                  <button
                    onClick={() => exportCsv(
                      `${activeReport}_report_${new Date().toISOString().split('T')[0]}.csv`,
                      report.headers,
                      report.rows
                    )}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#00BA7C] hover:bg-[#00BA7C] rounded-xl text-xs font-bold text-white transition shadow-sm"
                  >
                    <Download className="h-3.5 w-3.5" /> Export CSV
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-[10px] text-slate-500 uppercase font-bold border-b border-slate-200 bg-slate-50">
                      {report.headers.map(h => (
                        <th key={h} className="text-left px-4 py-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {report.render()}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── SUBTAB 2: SAVED REPORTS & SCHEDULES ── */}
      {activeSubTab === 'saved' && (
        <div className="space-y-4 max-w-4xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Automated Scheduled Reports</h2>
              <p className="text-xs text-slate-500">Configure recurring report exports delivered directly to stakeholder email addresses.</p>
            </div>
            <button
              onClick={() => setAddReportModal(true)}
              className="px-4 py-2 bg-[#00BA7C] hover:bg-[#00BA7C] text-white text-xs font-bold rounded-xl transition flex items-center gap-1"
            >
              <Plus className="h-3.5 w-3.5" /> Create Saved Report
            </button>
          </div>

          <div className="space-y-3">
            {savedReports.map(sr => (
              <div key={sr.id} className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-slate-900">{sr.title}</h3>
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded uppercase">
                        {sr.category}
                      </span>
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded font-mono">
                        {sr.schedule}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5 text-slate-400" />
                      Recipients: <span className="font-semibold text-slate-700">{sr.recipients}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRunNow(sr)}
                      className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-lg transition flex items-center gap-1"
                    >
                      <Play className="h-3 w-3" /> Run Now
                    </button>
                    <button
                      onClick={() => handleDeleteSavedReport(sr.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 transition"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex justify-between text-[11px] text-slate-400 font-mono">
                  <span>Last Automated Execution: {sr.lastRun}</span>
                  <span>Format: {sr.format}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── ADD SAVED REPORT MODAL ── */}
      {addReportModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-slate-900">Create Saved Report Template</h3>
            <form onSubmit={handleAddSavedReport} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Report Title</label>
                <input
                  type="text"
                  value={reportForm.title}
                  onChange={e => setReportForm({ ...reportForm, title: e.target.value })}
                  required
                  placeholder="e.g. Monthly IFTA State Tax Rollup"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Category</label>
                  <select
                    value={reportForm.category}
                    onChange={e => setReportForm({ ...reportForm, category: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900 font-bold"
                  >
                    <option value="IFTA">IFTA State Tax</option>
                    <option value="OPERATIONS">Operations & Fuel</option>
                    <option value="MAINTENANCE">Maintenance & PM</option>
                    <option value="FINANCIAL">Financial / Costs</option>
                    <option value="SAFETY">DOT Safety</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Schedule Frequency</label>
                  <select
                    value={reportForm.schedule}
                    onChange={e => setReportForm({ ...reportForm, schedule: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900 font-bold"
                  >
                    <option value="DAILY">Daily at Midnight</option>
                    <option value="WEEKLY">Weekly (Mondays)</option>
                    <option value="MONTHLY">Monthly (1st of month)</option>
                    <option value="MANUAL">Manual Trigger Only</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Recipient Email Addresses</label>
                <input
                  type="text"
                  value={reportForm.recipients}
                  onChange={e => setReportForm({ ...reportForm, recipients: e.target.value })}
                  placeholder="e.g. accountant@fleet.com, manager@fleet.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Export File Format</label>
                <select
                  value={reportForm.format}
                  onChange={e => setReportForm({ ...reportForm, format: e.target.value as any })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900 font-bold"
                >
                  <option value="CSV">CSV Spreadsheet (.csv)</option>
                  <option value="PDF">Formatted PDF Document (.pdf)</option>
                  <option value="EXCEL">Microsoft Excel (.xlsx)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setAddReportModal(false)} className="px-3 py-1.5 bg-slate-100 text-xs font-bold rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-[#00BA7C] text-white text-xs font-bold rounded-lg">Save Report Schedule</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
