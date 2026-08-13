'use client';
import React, { useState } from 'react';
import { Part, User as DbUser, getStore, setStore, initialParts } from '../mockDb';
import { Plus, AlertTriangle, Package, Search } from 'lucide-react';

interface Props {
  parts: Part[];
  currentUser: DbUser;
  onRefresh: () => void;
}

const catColors: Record<string, string> = {
  ENGINE: 'bg-red-500/20 text-red-300',
  BRAKES: 'bg-orange-500/20 text-orange-300',
  ELECTRICAL: 'bg-yellow-500/20 text-yellow-300',
  FILTERS: 'bg-blue-500/20 text-blue-300',
  TIRES: 'bg-indigo-500/20 text-indigo-300',
  FLUIDS: 'bg-cyan-500/20 text-cyan-300',
  BODY: 'bg-violet-500/20 text-violet-300',
  HVAC: 'bg-emerald-500/20 text-emerald-300',
  OTHER: 'bg-slate-600 text-slate-300',
};

function stockStatus(qty: number, reorder: number) {
  if (qty === 0) return { label: 'OUT OF STOCK', color: 'text-red-400 bg-red-500/10' };
  if (qty <= reorder) return { label: 'LOW STOCK', color: 'text-amber-400 bg-amber-500/10' };
  return { label: 'IN STOCK', color: 'text-green-400 bg-green-500/10' };
}

export default function Parts({ parts, currentUser, onRefresh }: Props) {
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('ALL');
  const [showForm, setShowForm] = useState(false);
  const [useModal, setUseModal] = useState<Part | null>(null);
  const [restockModal, setRestockModal] = useState<Part | null>(null);
  const [useQty, setUseQty] = useState(1);
  const [restockQty, setRestockQty] = useState(10);
  const [newPart, setNewPart] = useState<Partial<Part>>({
    partNumber: '', name: '', category: 'FILTERS', stockQty: 1, reorderLevel: 2, unitCost: 0, location: '', compatibleAssets: []
  });

  const canManage = ['MECHANIC', 'MAINTENANCE_ADMIN', 'FLEET_MANAGER'].includes(currentUser.role);

  const displayed = parts
    .filter(p => catFilter === 'ALL' || p.category === catFilter)
    .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.partNumber.toLowerCase().includes(search.toLowerCase()));

  const lowStockCount = parts.filter(p => p.stockQty <= p.reorderLevel).length;
  const outCount = parts.filter(p => p.stockQty === 0).length;

  const handleUsePart = () => {
    if (!useModal) return;
    if (useQty > useModal.stockQty) { alert('Insufficient stock.'); return; }
    const all = getStore('parts', initialParts);
    const updated = all.map(p => p.id === useModal.id ? { ...p, stockQty: p.stockQty - useQty } : p);
    setStore('parts', updated);
    setUseModal(null);
    setUseQty(1);
    onRefresh();
  };

  const handleRestock = () => {
    if (!restockModal) return;
    const all = getStore('parts', initialParts);
    const updated = all.map(p => p.id === restockModal.id ? { ...p, stockQty: p.stockQty + restockQty } : p);
    setStore('parts', updated);
    setRestockModal(null);
    setRestockQty(10);
    onRefresh();
  };

  const handleAddPart = () => {
    if (!newPart.partNumber || !newPart.name) { alert('Part number and name required.'); return; }
    const part: Part = {
      id: 'p-' + Math.random().toString(36).substr(2, 8),
      partNumber: newPart.partNumber!,
      name: newPart.name!,
      category: newPart.category as Part['category'],
      stockQty: newPart.stockQty || 0,
      reorderLevel: newPart.reorderLevel || 2,
      unitCost: newPart.unitCost || 0,
      location: newPart.location || '',
      compatibleAssets: newPart.compatibleAssets || [],
    };
    const all = getStore('parts', initialParts);
    all.unshift(part);
    setStore('parts', all);
    setShowForm(false);
    onRefresh();
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 text-center">
          <Package className="h-5 w-5 text-indigo-600 mx-auto mb-1" />
          <p className="text-2xl font-black text-slate-900">{parts.length}</p>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Parts</p>
        </div>
        <div className="bg-white border border-amber-200 shadow-sm rounded-2xl p-4 text-center">
          <AlertTriangle className="h-5 w-5 text-amber-600 mx-auto mb-1" />
          <p className="text-2xl font-black text-amber-600">{lowStockCount}</p>
          <p className="text-[10px] text-amber-700 font-bold uppercase tracking-wider">Low Stock</p>
        </div>
        <div className="bg-white border border-red-200 shadow-sm rounded-2xl p-4 text-center">
          <AlertTriangle className="h-5 w-5 text-red-600 mx-auto mb-1" />
          <p className="text-2xl font-black text-red-600">{outCount}</p>
          <p className="text-[10px] text-red-700 font-bold uppercase tracking-wider">Out of Stock</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search parts..."
              className="bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 font-medium w-48 shadow-xs" />
          </div>
          <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 font-medium shadow-xs">
            <option value="ALL">All Categories</option>
            {Object.keys(catColors).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        {canManage && (
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold text-white transition shadow-sm">
            <Plus className="h-3.5 w-3.5" /> Add Part
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 space-y-4">
          <h4 className="text-sm font-bold text-slate-900">Add New Part</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { label: 'Part Number', key: 'partNumber', type: 'text' },
              { label: 'Part Name', key: 'name', type: 'text' },
              { label: 'Location (Shelf)', key: 'location', type: 'text' },
              { label: 'Initial Qty', key: 'stockQty', type: 'number' },
              { label: 'Reorder Level', key: 'reorderLevel', type: 'number' },
              { label: 'Unit Cost ($)', key: 'unitCost', type: 'number' },
            ].map(({ label, key, type }) => (
              <div key={key}>
                <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">{label}</label>
                <input type={type} value={(newPart as any)[key] || ''}
                  onChange={e => setNewPart(p => ({ ...p, [key]: type === 'number' ? +e.target.value : e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 font-medium" />
              </div>
            ))}
            <div>
              <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Category</label>
              <select value={newPart.category} onChange={e => setNewPart(p => ({ ...p, category: e.target.value as any }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 font-medium">
                {Object.keys(catColors).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowForm(false)} className="px-3 py-1.5 bg-slate-100 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-200">Cancel</button>
            <button onClick={handleAddPart} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold text-white shadow-sm">Add Part</button>
          </div>
        </div>
      )}

      {/* Parts Table */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[10px] text-slate-500 uppercase font-bold border-b border-slate-200 bg-slate-50">
                <th className="text-left px-4 py-3">Part #</th>
                <th className="text-left px-4 py-3">Name</th>
                <th className="text-left px-4 py-3">Category</th>
                <th className="text-right px-4 py-3">Stock</th>
                <th className="text-right px-4 py-3">Unit Cost</th>
                <th className="text-left px-4 py-3">Location</th>
                <th className="text-left px-4 py-3">Status</th>
                {canManage && <th className="text-left px-4 py-3">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayed.map(p => {
                const st = stockStatus(p.stockQty, p.reorderLevel);
                return (
                  <tr key={p.id} className="text-slate-800 hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-[11px] text-indigo-600 font-bold">{p.partNumber}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">{p.name}</td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] px-2.5 py-1 rounded-full font-bold bg-slate-100 text-slate-700 border border-slate-200">{p.category}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-extrabold text-slate-900">{p.stockQty}</td>
                    <td className="px-4 py-3 text-right text-slate-600 font-medium">${p.unitCost.toFixed(2)}</td>
                    <td className="px-4 py-3 text-slate-500 font-mono text-[10px]">{p.location}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${st.color}`}>{st.label}</span>
                    </td>
                    {canManage && (
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => { setUseModal(p); setUseQty(1); }}
                            className="text-[10px] px-2.5 py-1 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 rounded-lg font-bold">Use</button>
                          <button onClick={() => { setRestockModal(p); setRestockQty(10); }}
                            className="text-[10px] px-2.5 py-1 bg-green-50 hover:bg-green-100 border border-green-200 text-green-700 rounded-lg font-bold">Restock</button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Use Part Modal */}
      {useModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-80 space-y-4 shadow-xl">
            <h4 className="font-bold text-slate-900">Use Parts from Stock</h4>
            <p className="text-xs text-slate-600 font-medium">{useModal.name}</p>
            <p className="text-xs text-slate-500">Current stock: <span className="text-slate-900 font-extrabold">{useModal.stockQty}</span></p>
            <div>
              <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Quantity to Use</label>
              <input type="number" value={useQty} onChange={e => setUseQty(+e.target.value)} min={1} max={useModal.stockQty}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-600 font-medium" />
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setUseModal(null)} className="px-4 py-2 bg-slate-100 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-200">Cancel</button>
              <button onClick={handleUsePart} className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-xl text-xs font-bold text-white shadow-sm">Confirm Use</button>
            </div>
          </div>
        </div>
      )}

      {/* Restock Modal */}
      {restockModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-80 space-y-4 shadow-xl">
            <h4 className="font-bold text-slate-900">Receive Stock</h4>
            <p className="text-xs text-slate-600 font-medium">{restockModal.name}</p>
            <p className="text-xs text-slate-500">Current stock: <span className="text-slate-900 font-extrabold">{restockModal.stockQty}</span></p>
            <div>
              <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Quantity to Add</label>
              <input type="number" value={restockQty} onChange={e => setRestockQty(+e.target.value)} min={1}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-600 font-medium" />
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setRestockModal(null)} className="px-4 py-2 bg-slate-100 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-200">Cancel</button>
              <button onClick={handleRestock} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-xs font-bold text-white shadow-sm">Receive Stock</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
