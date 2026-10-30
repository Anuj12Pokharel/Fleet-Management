'use client';
import React, { useState } from 'react';
import { ExpenseRecord, Asset, User as DbUser } from '../mockDb';
import { apiCreateExpense } from '../lib/api-client';
import { Plus, DollarSign, TrendingUp } from 'lucide-react';

interface Props {
  expenseRecords: ExpenseRecord[];
  assets: Asset[];
  currentUser: DbUser;
  onRefresh: () => void;
}

const CATEGORIES: ExpenseRecord['category'][] = ['FUEL', 'LABOR', 'PARTS', 'TOLLS', 'INSURANCE', 'REGISTRATION', 'TIRES', 'OTHER'];

const catColors: Record<string, string> = {
  FUEL: '#3b82f6', LABOR: '#8b5cf6', PARTS: '#f59e0b', TOLLS: '#06b6d4',
  INSURANCE: '#ec4899', REGISTRATION: '#10b981', TIRES: '#f97316', OTHER: '#6b7280'
};

export default function Expenses({ expenseRecords, assets, currentUser, onRefresh }: Props) {
  const [selectedAsset, setSelectedAsset] = useState<string>('ALL');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ assetId: assets[0]?.id || '', category: 'FUEL' as ExpenseRecord['category'], amount: '', description: '', date: new Date().toISOString().split('T')[0] });

  const canAdd = ['MAINTENANCE_ADMIN', 'FLEET_MANAGER'].includes(currentUser.role);

  const filtered = selectedAsset === 'ALL'
    ? expenseRecords
    : expenseRecords.filter(e => e.assetId === selectedAsset);

  const total = filtered.reduce((s, e) => s + e.amount, 0);

  const byCategory = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = filtered.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0);
    return acc;
  }, {} as Record<string, number>);

  const maxCat = Math.max(...Object.values(byCategory), 1);

  const handleSubmit = async () => {
    if (!form.amount || !form.description) { alert('Amount and description are required.'); return; }
    try {
      await apiCreateExpense({
        assetId: form.assetId,
        category: form.category,
        amount: parseFloat(form.amount),
        description: form.description,
        date: form.date,
        linkedWoId: null
      });
      setShowForm(false);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to save expense to database.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 space-y-1">
          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Total Spend</p>
          <p className="text-2xl font-black text-slate-900">${total.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
          <p className="text-[10px] text-slate-500 font-medium">{filtered.length} transactions</p>
        </div>
        <div className="bg-white border border-blue-200 shadow-sm rounded-2xl p-4 space-y-1">
          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Top Category</p>
          <p className="text-xl font-black text-blue-700">{Object.entries(byCategory).sort((a,b) => b[1]-a[1])[0]?.[0] || '—'}</p>
          <p className="text-[10px] text-slate-500 font-medium">${(Object.entries(byCategory).sort((a,b) => b[1]-a[1])[0]?.[1] || 0).toLocaleString()}</p>
        </div>
        <div className="bg-white border border-violet-200 shadow-sm rounded-2xl p-4 space-y-1">
          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Avg per Asset</p>
          <p className="text-xl font-black text-violet-700">${assets.length > 0 ? Math.round(total / assets.length).toLocaleString() : 0}</p>
          <p className="text-[10px] text-slate-500 font-medium">across {assets.length} assets</p>
        </div>
        <div className="bg-white border border-amber-200 shadow-sm rounded-2xl p-4 space-y-1">
          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Cost/Mile (est.)</p>
          {(() => {
            const asset = assets.find(a => a.id === selectedAsset);
            const cpm = asset ? (total / asset.odometer).toFixed(3) : '—';
            return <p className="text-xl font-black text-amber-700">{typeof cpm === 'string' && cpm !== '—' ? `$${cpm}` : cpm}</p>;
          })()}
          <p className="text-[10px] text-slate-500 font-medium">select one asset for CPM</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <select value={selectedAsset} onChange={e => setSelectedAsset(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:border-[#00BA7C] shadow-xs">
            <option value="ALL">All Assets</option>
            {assets.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
        {canAdd && (
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-[#00BA7C] hover:bg-[#00BA7C] rounded-xl text-xs font-bold text-white transition shadow-sm">
            <Plus className="h-3.5 w-3.5" /> Add Expense
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 space-y-4">
          <h4 className="text-sm font-bold text-slate-900">Add Manual Expense</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Asset</label>
              <select value={form.assetId} onChange={e => setForm(f => ({ ...f, assetId: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#00BA7C] font-medium">
                {assets.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Category</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as any }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#00BA7C] font-medium">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Amount ($)</label>
              <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                placeholder="0.00"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#00BA7C] font-medium" />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Date</label>
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#00BA7C] font-medium" />
            </div>
            <div className="col-span-2 md:col-span-4">
              <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Description</label>
              <input type="text" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Expense details..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#00BA7C] font-medium" />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowForm(false)} className="px-3 py-1.5 bg-slate-100 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-200">Cancel</button>
            <button onClick={handleSubmit} className="px-3 py-1.5 bg-[#00BA7C] hover:bg-[#00BA7C] rounded-xl text-xs font-bold text-white shadow-sm">Save Expense</button>
          </div>
        </div>
      )}

      {/* Category Breakdown Bar Chart */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5">
        <h4 className="text-sm font-bold text-slate-900 mb-4">Spend by Category</h4>
        <div className="space-y-2.5">
          {CATEGORIES.filter(c => byCategory[c] > 0).sort((a, b) => byCategory[b] - byCategory[a]).map(cat => (
            <div key={cat} className="flex items-center gap-3">
              <span className="text-[10px] text-slate-600 font-bold w-20 shrink-0">{cat}</span>
              <div className="flex-1 bg-slate-100 rounded-full h-2">
                <div className="h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(byCategory[cat] / maxCat) * 100}%`, background: catColors[cat] }} />
              </div>
              <span className="text-[10px] font-bold text-slate-900 w-20 text-right">${byCategory[cat].toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Transaction Log */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5">
        <h4 className="text-sm font-bold text-slate-900 mb-3">Transaction Log</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[10px] text-slate-500 font-bold uppercase border-b border-slate-200 bg-slate-50">
                <th className="text-left py-2 pr-4">Date</th>
                <th className="text-left py-2 pr-4">Asset</th>
                <th className="text-left py-2 pr-4">Category</th>
                <th className="text-left py-2 pr-4">Description</th>
                <th className="text-right py-2">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 font-medium text-xs">
                    No expense records found. Click &quot;+ Add Expense&quot; above to log a new expense.
                  </td>
                </tr>
              ) : (
                filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(e => {
                  const asset = assets.find(a => a.id === e.assetId);
                  return (
                    <tr key={e.id} className="text-slate-800 hover:bg-slate-50">
                      <td className="py-2 pr-4 text-slate-500 font-medium">{e.date}</td>
                      <td className="py-2 pr-4 text-slate-800 font-bold text-[10px]">{asset?.name || e.assetId}</td>
                      <td className="py-2 pr-4">
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {e.category}
                        </span>
                      </td>
                      <td className="py-2 pr-4 text-slate-600 font-medium">{e.description}</td>
                      <td className="py-2 text-right font-extrabold text-slate-900">${e.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
