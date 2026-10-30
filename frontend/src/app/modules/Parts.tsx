'use client';
import React, { useState } from 'react';
import {
  Part,
  PartLocationConfig,
  PartCategoryConfig,
  PartManufacturerConfig,
  MeasurementUnitConfig,
  User as DbUser,
  getStore,
  setStore,
  initialParts,
  initialPartLocations,
  initialPartCategories,
  initialPartManufacturers,
  initialMeasurementUnits
} from '../mockDb';
import {
  apiGetParts,
  apiCreatePart,
  apiUsePart,
  apiRestockPart,
  apiDeletePart,
  apiGetPartLocations,
  apiCreatePartLocation,
  apiGetPartCategories,
  apiCreatePartCategory,
  apiGetPartManufacturers,
  apiCreatePartManufacturer,
  apiGetMeasurementUnits,
  apiCreateMeasurementUnit,
} from '../lib/api-client';
import {
  Plus,
  AlertTriangle,
  Package,
  Search,
  MapPin,
  Tag,
  Factory,
  Ruler,
  Trash2,
  CheckCircle,
  TrendingDown,
  Layers
} from 'lucide-react';

interface Props {
  parts: Part[];
  currentUser: DbUser;
  onRefresh: () => void;
}

const catColors: Record<string, string> = {
  ENGINE: 'bg-red-50 text-red-700 border-red-200',
  BRAKES: 'bg-orange-50 text-orange-700 border-orange-200',
  ELECTRICAL: 'bg-yellow-50 text-yellow-800 border-yellow-200',
  FILTERS: 'bg-blue-50 text-blue-700 border-blue-200',
  TIRES: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  FLUIDS: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  BODY: 'bg-violet-50 text-violet-700 border-violet-200',
  HVAC: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  OTHER: 'bg-slate-50 text-slate-700 border-slate-200',
};

function stockStatus(qty: number, reorder: number) {
  if (qty === 0) return { label: 'OUT OF STOCK', color: 'text-rose-600 bg-rose-50 border-rose-200' };
  if (qty <= reorder) return { label: 'LOW STOCK', color: 'text-amber-600 bg-amber-50 border-amber-200' };
  return { label: 'IN STOCK', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
}

export default function Parts({ parts, currentUser, onRefresh }: Props) {
  const [activeSubTab, setActiveSubTab] = useState<'inventory' | 'locations' | 'categories' | 'manufacturers' | 'units'>('inventory');

  // Sub tab stores
  const [locations, setLocations] = useState<PartLocationConfig[]>(() => getStore('partLocations', initialPartLocations));
  const [categories, setCategories] = useState<PartCategoryConfig[]>(() => getStore('partCategories', initialPartCategories));
  const [manufacturers, setManufacturers] = useState<PartManufacturerConfig[]>(() => getStore('partManufacturers', initialPartManufacturers));
  const [units, setUnits] = useState<MeasurementUnitConfig[]>(() => getStore('measurementUnits', initialMeasurementUnits));

  // Inventory filter states
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('ALL');
  const [showForm, setShowForm] = useState(false);
  const [useModal, setUseModal] = useState<Part | null>(null);
  const [restockModal, setRestockModal] = useState<Part | null>(null);
  const [useQty, setUseQty] = useState(1);
  const [restockQty, setRestockQty] = useState(10);
  const [newPart, setNewPart] = useState<Partial<Part>>({
    partNumber: '', name: '', category: 'FILTERS', stockQty: 1, reorderLevel: 2, unitCost: 0, location: 'Shelf A-1', compatibleAssets: []
  });

  // Modals for subtabs
  const [addLocModal, setAddLocModal] = useState(false);
  const [locForm, setLocForm] = useState({ name: '', type: 'WAREHOUSE' as PartLocationConfig['type'], address: '', capacity: 100 });

  const [addCatModal, setAddCatModal] = useState(false);
  const [catForm, setCatForm] = useState({ name: '', code: '', description: '' });

  const [addMfgModal, setAddMfgModal] = useState(false);
  const [mfgForm, setMfgForm] = useState({ name: '', country: 'USA', contactInfo: '' });

  const [addUnitModal, setAddUnitModal] = useState(false);
  const [unitForm, setUnitForm] = useState({ name: '', symbol: '', type: 'QUANTITY' as MeasurementUnitConfig['type'] });

  const canManage = ['MECHANIC', 'MAINTENANCE_ADMIN', 'FLEET_MANAGER'].includes(currentUser.role);

  const displayed = parts
    .filter(p => catFilter === 'ALL' || p.category === catFilter)
    .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.partNumber.toLowerCase().includes(search.toLowerCase()));

  const lowStockCount = parts.filter(p => p.stockQty <= p.reorderLevel).length;
  const outCount = parts.filter(p => p.stockQty === 0).length;

  const handleUsePart = async () => {
    if (!useModal) return;
    if (useQty > useModal.stockQty) { alert('Insufficient stock.'); return; }
    
    // Async call backend API
    try {
      await apiUsePart(useModal.id, useQty);
    } catch (e) {
      console.warn('Backend offline or API fallback:', e);
    }

    const all = getStore('parts', initialParts);
    const updated = all.map(p => p.id === useModal.id ? { ...p, stockQty: p.stockQty - useQty } : p);
    setStore('parts', updated);
    setUseModal(null);
    setUseQty(1);
    onRefresh();
  };

  const handleRestock = async () => {
    if (!restockModal) return;

    // Async call backend API
    try {
      await apiRestockPart(restockModal.id, restockQty);
    } catch (e) {
      console.warn('Backend offline or API fallback:', e);
    }

    const all = getStore('parts', initialParts);
    const updated = all.map(p => p.id === restockModal.id ? { ...p, stockQty: p.stockQty + restockQty } : p);
    setStore('parts', updated);
    setRestockModal(null);
    setRestockQty(10);
    onRefresh();
  };

  const handleAddPart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPart.partNumber || !newPart.name) { alert('Part number and name required.'); return; }
    
    const payload = {
      partNumber: newPart.partNumber!,
      name: newPart.name!,
      category: newPart.category || 'FILTERS',
      stockQty: Number(newPart.stockQty) || 0,
      reorderLevel: Number(newPart.reorderLevel) || 2,
      unitCost: Number(newPart.unitCost) || 0,
      location: newPart.location || 'Warehouse A',
    };

    let createdId = 'p-' + Math.random().toString(36).substr(2, 8);
    try {
      const res = await apiCreatePart(payload);
      if (res?.id) createdId = res.id;
    } catch (e) {
      console.warn('Backend offline or API fallback:', e);
    }

    const part: Part = {
      id: createdId,
      ...payload,
      category: payload.category as Part['category'],
      compatibleAssets: newPart.compatibleAssets || [],
    };
    const all = getStore('parts', initialParts);
    all.unshift(part);
    setStore('parts', all);
    setShowForm(false);
    onRefresh();
  };

  // Subtab handlers
  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locForm.name) return;
    try {
      await apiCreatePartLocation(locForm);
    } catch (e) {
      console.warn('Backend API fallback:', e);
    }
    const newL: PartLocationConfig = {
      id: 'ploc-' + Math.random().toString(36).substr(2, 8),
      ...locForm
    };
    const updated = [...locations, newL];
    setStore('partLocations', updated);
    setLocations(updated);
    setAddLocModal(false);
    setLocForm({ name: '', type: 'WAREHOUSE', address: '', capacity: 100 });
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catForm.name || !catForm.code) return;
    try {
      await apiCreatePartCategory(catForm);
    } catch (e) {
      console.warn('Backend API fallback:', e);
    }
    const newC: PartCategoryConfig = {
      id: 'pcat-' + Math.random().toString(36).substr(2, 8),
      ...catForm
    };
    const updated = [...categories, newC];
    setStore('partCategories', updated);
    setCategories(updated);
    setAddCatModal(false);
    setCatForm({ name: '', code: '', description: '' });
  };

  const handleAddManufacturer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfgForm.name) return;
    try {
      await apiCreatePartManufacturer(mfgForm);
    } catch (e) {
      console.warn('Backend API fallback:', e);
    }
    const newM: PartManufacturerConfig = {
      id: 'pmfg-' + Math.random().toString(36).substr(2, 8),
      ...mfgForm,
      isPreferred: true
    };
    const updated = [...manufacturers, newM];
    setStore('partManufacturers', updated);
    setManufacturers(updated);
    setAddMfgModal(false);
    setMfgForm({ name: '', country: 'USA', contactInfo: '' });
  };

  const handleAddUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitForm.name || !unitForm.symbol) return;
    try {
      await apiCreateMeasurementUnit(unitForm);
    } catch (e) {
      console.warn('Backend API fallback:', e);
    }
    const newU: MeasurementUnitConfig = {
      id: 'mu-' + Math.random().toString(36).substr(2, 8),
      ...unitForm
    };
    const updated = [...units, newU];
    setStore('measurementUnits', updated);
    setUnits(updated);
    setAddUnitModal(false);
    setUnitForm({ name: '', symbol: '', type: 'QUANTITY' });
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Navigation Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2.5">
            <Package className="h-6 w-6 text-[#00BA7C]" />
            Parts & Inventory
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track stock levels, reorder thresholds, warehouse bins, component categories, and OEM manufacturers.
          </p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
          <button
            onClick={() => setActiveSubTab('inventory')}
            className={`px-3 py-1.5 rounded-lg transition ${activeSubTab === 'inventory' ? 'bg-white text-[#00BA7C] shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Parts Inventory
          </button>
          <button
            onClick={() => setActiveSubTab('locations')}
            className={`px-3 py-1.5 rounded-lg transition ${activeSubTab === 'locations' ? 'bg-white text-[#00BA7C] shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Part Locations
          </button>
          <button
            onClick={() => setActiveSubTab('categories')}
            className={`px-3 py-1.5 rounded-lg transition ${activeSubTab === 'categories' ? 'bg-white text-[#00BA7C] shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Part Categories
          </button>
          <button
            onClick={() => setActiveSubTab('manufacturers')}
            className={`px-3 py-1.5 rounded-lg transition ${activeSubTab === 'manufacturers' ? 'bg-white text-[#00BA7C] shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Part Manufacturers
          </button>
          <button
            onClick={() => setActiveSubTab('units')}
            className={`px-3 py-1.5 rounded-lg transition ${activeSubTab === 'units' ? 'bg-white text-[#00BA7C] shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Measurement Units
          </button>
        </div>
      </div>

      {/* ── SUBTAB 1: PARTS INVENTORY ── */}
      {activeSubTab === 'inventory' && (
        <div className="space-y-6">
          {/* Summary KPIs */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 text-center">
              <Package className="h-5 w-5 text-[#00BA7C] mx-auto mb-1" />
              <p className="text-2xl font-black text-slate-900">{parts.length}</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total SKUs</p>
            </div>
            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 text-center">
              <TrendingDown className="h-5 w-5 text-amber-500 mx-auto mb-1" />
              <p className="text-2xl font-black text-amber-600">{lowStockCount}</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Low Stock SKUs</p>
            </div>
            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 text-center">
              <AlertTriangle className="h-5 w-5 text-rose-500 mx-auto mb-1" />
              <p className="text-2xl font-black text-rose-600">{outCount}</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Out of Stock</p>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search part name or SKU..."
                  className="pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#00BA7C] w-56"
                />
              </div>

              <select
                value={catFilter}
                onChange={e => setCatFilter(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700"
              >
                <option value="ALL">All Categories</option>
                {Object.keys(catColors).map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {canManage && (
              <button
                onClick={() => setShowForm(!showForm)}
                className="px-4 py-2 bg-[#00BA7C] hover:bg-[#00BA7C] text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5"
              >
                <Plus className="h-4 w-4" /> {showForm ? 'Cancel' : 'Add New Part SKU'}
              </button>
            )}
          </div>

          {/* Add Part Form Inline */}
          {showForm && (
            <form onSubmit={handleAddPart} className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-slate-900">Add New Part to Inventory</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Part SKU / Number</label>
                  <input
                    type="text"
                    value={newPart.partNumber}
                    onChange={e => setNewPart({ ...newPart, partNumber: e.target.value })}
                    required
                    placeholder="e.g. BRK-PAD-042"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Part Name / Description</label>
                  <input
                    type="text"
                    value={newPart.name}
                    onChange={e => setNewPart({ ...newPart, name: e.target.value })}
                    required
                    placeholder="e.g. Heavy Duty Brake Shoe Kit"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Category</label>
                  <select
                    value={newPart.category}
                    onChange={e => setNewPart({ ...newPart, category: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900 font-semibold"
                  >
                    {Object.keys(catColors).map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Initial Stock Qty</label>
                  <input
                    type="number"
                    value={newPart.stockQty}
                    onChange={e => setNewPart({ ...newPart, stockQty: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Reorder Level Threshold</label>
                  <input
                    type="number"
                    value={newPart.reorderLevel}
                    onChange={e => setNewPart({ ...newPart, reorderLevel: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Unit Cost ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newPart.unitCost}
                    onChange={e => setNewPart({ ...newPart, unitCost: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#00BA7C] hover:bg-[#00BA7C] text-white text-xs font-bold rounded-lg shadow-sm"
                >
                  Save Part SKU
                </button>
              </div>
            </form>
          )}

          {/* Parts Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-4">SKU / Description</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Bin Location</th>
                  <th className="p-4">Stock Status</th>
                  <th className="p-4">Unit Cost</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayed.map(p => {
                  const status = stockStatus(p.stockQty, p.reorderLevel);
                  return (
                    <tr key={p.id} className="hover:bg-slate-50 transition">
                      <td className="p-4">
                        <p className="font-mono font-bold text-slate-900">{p.partNumber}</p>
                        <p className="text-slate-600 text-xs mt-0.5">{p.name}</p>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase ${catColors[p.category] || 'bg-slate-50 text-slate-600'}`}>
                          {p.category}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-slate-600">{p.location || 'Warehouse A'}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${status.color}`}>
                            {status.label} ({p.stockQty})
                          </span>
                        </div>
                      </td>
                      <td className="p-4 font-mono font-bold text-slate-900">${p.unitCost.toFixed(2)}</td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => { setUseModal(p); setUseQty(1); }}
                          disabled={p.stockQty === 0}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 rounded text-xs font-bold transition"
                        >
                          Use
                        </button>
                        <button
                          onClick={() => { setRestockModal(p); setRestockQty(10); }}
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded text-xs font-bold transition"
                        >
                          Restock
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── SUBTAB 2: PART LOCATIONS ── */}
      {activeSubTab === 'locations' && (
        <div className="space-y-4 max-w-4xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Storage Warehouses & Mobile Bins</h2>
              <p className="text-xs text-slate-500">Track physical storage locations across regional depots and mobile service trucks.</p>
            </div>
            <button
              onClick={() => setAddLocModal(true)}
              className="px-4 py-2 bg-[#00BA7C] hover:bg-[#00BA7C] text-white text-xs font-bold rounded-xl transition flex items-center gap-1"
            >
              <Plus className="h-3.5 w-3.5" /> Add Location
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {locations.map(loc => (
              <div key={loc.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-[#00BA7C]" />
                    <h3 className="font-bold text-sm text-slate-900">{loc.name}</h3>
                  </div>
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded">
                    {loc.type}
                  </span>
                </div>
                <p className="text-xs text-slate-500">{loc.address}</p>
                <div className="pt-2 border-t border-slate-100 flex justify-between text-xs text-slate-600">
                  <span>Bin Capacity:</span>
                  <span className="font-bold text-slate-900">{loc.capacity} SKUs</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── SUBTAB 3: PART CATEGORIES ── */}
      {activeSubTab === 'categories' && (
        <div className="space-y-4 max-w-4xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Part Categories</h2>
              <p className="text-xs text-slate-500">Manage classification taxonomy for inventory replenishment and costing.</p>
            </div>
            <button
              onClick={() => setAddCatModal(true)}
              className="px-4 py-2 bg-[#00BA7C] hover:bg-[#00BA7C] text-white text-xs font-bold rounded-xl transition flex items-center gap-1"
            >
              <Plus className="h-3.5 w-3.5" /> Add Category
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-4">Category Name</th>
                  <th className="p-4">Code</th>
                  <th className="p-4">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categories.map(cat => (
                  <tr key={cat.id} className="hover:bg-slate-50">
                    <td className="p-4 font-bold text-slate-900">{cat.name}</td>
                    <td className="p-4 font-mono text-[#00BA7C] font-semibold">{cat.code}</td>
                    <td className="p-4 text-slate-600">{cat.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── SUBTAB 4: PART MANUFACTURERS ── */}
      {activeSubTab === 'manufacturers' && (
        <div className="space-y-4 max-w-4xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-900">OEM & Aftermarket Manufacturers</h2>
              <p className="text-xs text-slate-500">Approved component suppliers and warranty manufacturer contacts.</p>
            </div>
            <button
              onClick={() => setAddMfgModal(true)}
              className="px-4 py-2 bg-[#00BA7C] hover:bg-[#00BA7C] text-white text-xs font-bold rounded-xl transition flex items-center gap-1"
            >
              <Plus className="h-3.5 w-3.5" /> Add Manufacturer
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {manufacturers.map(mfg => (
              <div key={mfg.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <Factory className="h-4 w-4 text-[#00BA7C]" />
                    <h3 className="font-bold text-sm text-slate-900">{mfg.name}</h3>
                  </div>
                  {mfg.isPreferred && (
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded border border-emerald-200">
                      Preferred OEM
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 font-mono">Contact: {mfg.contactInfo}</p>
                <p className="text-[11px] text-slate-400">Country of Origin: {mfg.country}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── SUBTAB 5: MEASUREMENT UNITS ── */}
      {activeSubTab === 'units' && (
        <div className="space-y-4 max-w-3xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Units of Measure</h2>
              <p className="text-xs text-slate-500">Standard measurement units for lubricants, friction parts, wiring and hardware.</p>
            </div>
            <button
              onClick={() => setAddUnitModal(true)}
              className="px-4 py-2 bg-[#00BA7C] hover:bg-[#00BA7C] text-white text-xs font-bold rounded-xl transition flex items-center gap-1"
            >
              <Plus className="h-3.5 w-3.5" /> Add Unit
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {units.map(u => (
              <div key={u.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex justify-between items-center">
                <div>
                  <p className="font-bold text-xs text-slate-900">{u.name}</p>
                  <p className="text-[10px] text-slate-400 uppercase font-bold">{u.type}</p>
                </div>
                <span className="px-2 py-1 bg-slate-100 text-emerald-700 font-mono text-xs font-bold rounded">
                  {u.symbol}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── MODALS ── */}

      {/* 1. USE PART MODAL */}
      {useModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-sm text-slate-900">Use Part: {useModal.name}</h3>
            <p className="text-xs text-slate-500 font-mono">Available Stock: {useModal.stockQty} units</p>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Quantity to Use</label>
              <input
                type="number"
                min={1}
                max={useModal.stockQty}
                value={useQty}
                onChange={e => setUseQty(parseInt(e.target.value) || 1)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-900"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setUseModal(null)} className="px-3 py-1.5 bg-slate-100 text-xs font-bold rounded-lg">Cancel</button>
              <button onClick={handleUsePart} className="px-4 py-1.5 bg-[#00BA7C] text-white text-xs font-bold rounded-lg">Confirm Usage</button>
            </div>
          </div>
        </div>
      )}

      {/* 2. RESTOCK MODAL */}
      {restockModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-sm text-slate-900">Restock Part: {restockModal.name}</h3>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Quantity Received</label>
              <input
                type="number"
                min={1}
                value={restockQty}
                onChange={e => setRestockQty(parseInt(e.target.value) || 1)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-900"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setRestockModal(null)} className="px-3 py-1.5 bg-slate-100 text-xs font-bold rounded-lg">Cancel</button>
              <button onClick={handleRestock} className="px-4 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg">Add to Stock</button>
            </div>
          </div>
        </div>
      )}

      {/* 3. ADD LOCATION MODAL */}
      {addLocModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-sm text-slate-900">Add Storage Location</h3>
            <form onSubmit={handleAddLocation} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Location Name</label>
                <input
                  type="text"
                  value={locForm.name}
                  onChange={e => setLocForm({ ...locForm, name: e.target.value })}
                  required
                  placeholder="e.g. Bin C-4 (Tire Rack)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Location Type</label>
                <select
                  value={locForm.type}
                  onChange={e => setLocForm({ ...locForm, type: e.target.value as any })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900 font-bold"
                >
                  <option value="WAREHOUSE">Warehouse</option>
                  <option value="SHOP_BIN">Shop Bin</option>
                  <option value="MOBILE_TRUCK">Mobile Service Truck</option>
                  <option value="DEPOT">Depot Storage</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Address / Bay</label>
                <input
                  type="text"
                  value={locForm.address}
                  onChange={e => setLocForm({ ...locForm, address: e.target.value })}
                  placeholder="e.g. Main Yard Bay 3"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setAddLocModal(false)} className="px-3 py-1.5 bg-slate-100 text-xs font-bold rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-[#00BA7C] text-white text-xs font-bold rounded-lg">Save Location</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. ADD CATEGORY MODAL */}
      {addCatModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-sm text-slate-900">Add Part Category</h3>
            <form onSubmit={handleAddCategory} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Category Name</label>
                <input
                  type="text"
                  value={catForm.name}
                  onChange={e => setCatForm({ ...catForm, name: e.target.value })}
                  required
                  placeholder="e.g. Suspension & Leaf Springs"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Category Code</label>
                <input
                  type="text"
                  value={catForm.code}
                  onChange={e => setCatForm({ ...catForm, code: e.target.value })}
                  required
                  placeholder="e.g. SUSP"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900 font-mono"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setAddCatModal(false)} className="px-3 py-1.5 bg-slate-100 text-xs font-bold rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-[#00BA7C] text-white text-xs font-bold rounded-lg">Save Category</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. ADD MANUFACTURER MODAL */}
      {addMfgModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-sm text-slate-900">Add Manufacturer</h3>
            <form onSubmit={handleAddManufacturer} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Manufacturer Name</label>
                <input
                  type="text"
                  value={mfgForm.name}
                  onChange={e => setMfgForm({ ...mfgForm, name: e.target.value })}
                  required
                  placeholder="e.g. Meritor Heavy Duty"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Contact Email / Phone</label>
                <input
                  type="text"
                  value={mfgForm.contactInfo}
                  onChange={e => setMfgForm({ ...mfgForm, contactInfo: e.target.value })}
                  placeholder="e.g. orders@meritor.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setAddMfgModal(false)} className="px-3 py-1.5 bg-slate-100 text-xs font-bold rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-[#00BA7C] text-white text-xs font-bold rounded-lg">Save Manufacturer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. ADD UNIT MODAL */}
      {addUnitModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-sm text-slate-900">Add Unit of Measure</h3>
            <form onSubmit={handleAddUnit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Unit Name</label>
                <input
                  type="text"
                  value={unitForm.name}
                  onChange={e => setUnitForm({ ...unitForm, name: e.target.value })}
                  required
                  placeholder="e.g. Roll"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Unit Symbol</label>
                <input
                  type="text"
                  value={unitForm.symbol}
                  onChange={e => setUnitForm({ ...unitForm, symbol: e.target.value })}
                  required
                  placeholder="e.g. rl"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900 font-mono"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setAddUnitModal(false)} className="px-3 py-1.5 bg-slate-100 text-xs font-bold rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-[#00BA7C] text-white text-xs font-bold rounded-lg">Save Unit</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
