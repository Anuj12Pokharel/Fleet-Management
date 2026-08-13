'use client';
import React, { useState } from 'react';
import { Asset, FuelLog, WorkOrder, EDVIRInspection, PMSchedule, DOTInspection, Part } from '../mockDb';
import { Download, FileText, Printer } from 'lucide-react';

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
  const [activeReport, setActiveReport] = useState<ReportType | null>(null);

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
        data: byAsset,
        render: () => byAsset.map((r, i) => (
          <tr key={i} className="hover:bg-slate-50 text-slate-800">
            <td className="px-4 py-3 font-bold text-slate-900">{r.asset}</td>
            <td className="px-4 py-3 text-center font-medium">{r.transactions}</td>
            <td className="px-4 py-3 text-center font-medium">{r.gallons.toFixed(0)}</td>
            <td className="px-4 py-3 text-right font-extrabold text-slate-900">${r.cost.toFixed(2)}</td>
            <td className="px-4 py-3 text-center font-medium">{r.avgMpg}</td>
            <td className={`px-4 py-3 text-center font-bold ${r.anomalies > 0 ? 'text-red-600' : 'text-green-700'}`}>{r.anomalies}</td>
          </tr>
        ))
      };
    }

    if (activeReport === 'pm') {
      return {
        headers: ['Asset', 'Template ID', 'Last Service', 'Next Due (mi)', 'Next Due (date)', 'Status'],
        rows: pmSchedules.map(s => {
          const a = assets.find(x => x.id === s.assetId);
          return [a?.name || s.assetId, s.templateId, s.lastServiceDate, s.nextDueOdometer, s.nextDueDate, s.status];
        }),
        render: () => pmSchedules.map((s, i) => {
          const a = assets.find(x => x.id === s.assetId);
          const sc = s.status === 'COMPLIANT' ? 'text-green-700' : s.status === 'DUE' ? 'text-amber-700' : 'text-red-700';
          return (
            <tr key={i} className="hover:bg-slate-50 text-slate-800">
              <td className="px-4 py-3 font-bold text-slate-900">{a?.name || s.assetId}</td>
              <td className="px-4 py-3 font-mono text-[10px] text-slate-500 font-semibold">{s.templateId}</td>
              <td className="px-4 py-3 font-medium">{s.lastServiceDate}</td>
              <td className="px-4 py-3 text-center font-medium">{s.nextDueOdometer.toLocaleString()} mi</td>
              <td className="px-4 py-3 font-medium">{s.nextDueDate}</td>
              <td className={`px-4 py-3 font-extrabold ${sc}`}>{s.status}</td>
            </tr>
          );
        })
      };
    }

    if (activeReport === 'inspection') {
      return {
        headers: ['Asset', 'Driver', 'Status', 'Odometer', 'Date', 'Notes'],
        rows: inspections.map(i => {
          const a = assets.find(x => x.id === i.assetId);
          return [a?.name || i.assetId, i.driverName, i.status, i.odometer, new Date(i.createdAt).toLocaleDateString(), i.notes || ''];
        }),
        render: () => inspections.map((ins, i) => {
          const a = assets.find(x => x.id === ins.assetId);
          return (
            <tr key={i} className="hover:bg-slate-50 text-slate-800">
              <td className="px-4 py-3 text-slate-900 font-bold">{a?.name || ins.assetId}</td>
              <td className="px-4 py-3 font-medium">{ins.driverName}</td>
              <td className={`px-4 py-3 font-extrabold ${ins.status === 'PASSED' ? 'text-green-700' : 'text-red-600'}`}>{ins.status}</td>
              <td className="px-4 py-3 font-medium">{ins.odometer.toLocaleString()}</td>
              <td className="px-4 py-3 text-slate-500 font-medium">{new Date(ins.createdAt).toLocaleDateString()}</td>
              <td className="px-4 py-3 text-slate-500 text-[10px] font-medium">{ins.notes || '—'}</td>
            </tr>
          );
        })
      };
    }

    if (activeReport === 'downtime') {
      const byAsset = assets.map(a => {
        const wos = workOrders.filter(w => w.assetId === a.id);
        const totalCost = wos.reduce((s, w) => s + w.totalCost, 0);
        const completed = wos.filter(w => w.status === 'COMPLETED').length;
        const open = wos.filter(w => w.status !== 'COMPLETED').length;
        return { asset: a.name, total: wos.length, open, completed, totalCost };
      });
      return {
        headers: ['Asset', 'Total WOs', 'Open', 'Completed', 'Total Repair Cost'],
        rows: byAsset.map(r => [r.asset, r.total, r.open, r.completed, `$${r.totalCost.toFixed(2)}`]),
        render: () => byAsset.map((r, i) => (
          <tr key={i} className="hover:bg-slate-50 text-slate-800">
            <td className="px-4 py-3 font-bold text-slate-900">{r.asset}</td>
            <td className="px-4 py-3 text-center font-medium">{r.total}</td>
            <td className={`px-4 py-3 text-center font-extrabold ${r.open > 0 ? 'text-amber-700' : 'text-slate-400'}`}>{r.open}</td>
            <td className="px-4 py-3 text-center text-green-700 font-extrabold">{r.completed}</td>
            <td className="px-4 py-3 text-right font-black text-slate-900">${r.totalCost.toFixed(2)}</td>
          </tr>
        ))
      };
    }

    if (activeReport === 'cpm') {
      const byAsset = assets.map(a => {
        const woCost = workOrders.filter(w => w.assetId === a.id).reduce((s, w) => s + w.totalCost, 0);
        const fuelCost = fuelLogs.filter(f => f.assetId === a.id).reduce((s, f) => s + f.cost, 0);
        const total = woCost + fuelCost;
        const cpm = a.odometer > 0 ? (total / a.odometer).toFixed(4) : 'N/A';
        return { asset: a.name, odometer: a.odometer, woCost, fuelCost, total, cpm };
      });
      return {
        headers: ['Asset', 'Odometer', 'WO Cost', 'Fuel Cost', 'Total Cost', 'Cost/Mile'],
        rows: byAsset.map(r => [r.asset, r.odometer.toLocaleString(), `$${r.woCost.toFixed(2)}`, `$${r.fuelCost.toFixed(2)}`, `$${r.total.toFixed(2)}`, r.cpm === 'N/A' ? 'N/A' : `$${r.cpm}`]),
        render: () => byAsset.map((r, i) => (
          <tr key={i} className="hover:bg-slate-50 text-slate-800">
            <td className="px-4 py-3 font-bold text-slate-900">{r.asset}</td>
            <td className="px-4 py-3 text-center font-medium">{r.odometer.toLocaleString()}</td>
            <td className="px-4 py-3 text-right text-slate-600 font-medium">${r.woCost.toFixed(2)}</td>
            <td className="px-4 py-3 text-right text-slate-600 font-medium">${r.fuelCost.toFixed(2)}</td>
            <td className="px-4 py-3 text-right font-bold text-slate-900">${r.total.toFixed(2)}</td>
            <td className="px-4 py-3 text-right font-black text-indigo-700">{r.cpm === 'N/A' ? '—' : `$${r.cpm}`}</td>
          </tr>
        ))
      };
    }

    if (activeReport === 'dot') {
      return {
        headers: ['Asset', 'Date', 'Result', 'Violations'],
        rows: dotInspections.map(d => {
          const a = assets.find(x => x.id === d.assetId);
          return [a?.name || d.assetId, d.inspectionDate, d.result, d.violationsJson.join('; ') || 'None'];
        }),
        render: () => dotInspections.map((d, i) => {
          const a = assets.find(x => x.id === d.assetId);
          return (
            <tr key={i} className="hover:bg-slate-50 text-slate-800">
              <td className="px-4 py-3 font-bold text-slate-900">{a?.name || d.assetId}</td>
              <td className="px-4 py-3 font-medium">{d.inspectionDate}</td>
              <td className={`px-4 py-3 font-extrabold ${d.result === 'CLEAN' ? 'text-green-700' : 'text-red-600'}`}>{d.result}</td>
              <td className="px-4 py-3 text-slate-500 text-[10px] font-medium">{d.violationsJson.join(', ') || '—'}</td>
            </tr>
          );
        })
      };
    }

    if (activeReport === 'parts') {
      return {
        headers: ['Part #', 'Name', 'Category', 'Stock', 'Reorder At', 'Unit Cost', 'Location'],
        rows: parts.map(p => [p.partNumber, p.name, p.category, p.stockQty, p.reorderLevel, `$${p.unitCost.toFixed(2)}`, p.location]),
        render: () => parts.map((p, i) => {
          const st = p.stockQty === 0 ? 'text-red-600' : p.stockQty <= p.reorderLevel ? 'text-amber-700' : 'text-green-700';
          return (
            <tr key={i} className="hover:bg-slate-50 text-slate-800">
              <td className="px-4 py-3 font-mono text-indigo-700 font-bold text-[10px]">{p.partNumber}</td>
              <td className="px-4 py-3 font-bold text-slate-900">{p.name}</td>
              <td className="px-4 py-3 text-slate-600 font-medium">{p.category}</td>
              <td className={`px-4 py-3 text-center font-extrabold ${st}`}>{p.stockQty}</td>
              <td className="px-4 py-3 text-center text-slate-500 font-medium">{p.reorderLevel}</td>
              <td className="px-4 py-3 text-right font-medium">${p.unitCost.toFixed(2)}</td>
              <td className="px-4 py-3 text-slate-500 font-mono text-[10px]">{p.location}</td>
            </tr>
          );
        })
      };
    }

    return null;
  };

  const report = renderReport();
  const activeReportMeta = REPORTS.find(r => r.id === activeReport);

  return (
    <div className="space-y-6">
      {/* Report tiles */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {REPORTS.map(r => (
          <button key={r.id} onClick={() => setActiveReport(r.id === activeReport ? null : r.id)}
            className={`text-left p-4 rounded-2xl border transition cursor-pointer shadow-xs ${
              activeReport === r.id
                ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-500'
                : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            }`}>
            <div className="text-2xl mb-2">{r.icon}</div>
            <p className="text-sm font-extrabold text-slate-900">{r.title}</p>
            <p className="text-[10px] text-slate-500 mt-0.5 font-medium">{r.desc}</p>
          </button>
        ))}
      </div>

      {/* Active Report */}
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
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition">
                <Printer className="h-3.5 w-3.5" /> Print
              </button>
              <button
                onClick={() => exportCsv(
                  `${activeReport}_report_${new Date().toISOString().split('T')[0]}.csv`,
                  report.headers,
                  report.rows
                )}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold text-white transition shadow-sm">
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
  );
}
