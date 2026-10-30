'use client';
import React, { useState } from 'react';
import {
  CustomFieldConfig,
  FleetGroupConfig,
  LabelTagConfig,
  SavedViewConfig,
  User as DbUser,
  getStore,
  setStore,
  initialCustomFields,
  initialFleetGroups,
  initialLabels,
  initialSavedViews
} from '../mockDb';
import {
  Layers,
  Tag,
  FolderTree,
  Eye,
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  Hash,
  Type,
  Calendar,
  List
} from 'lucide-react';

interface Props {
  currentUser: DbUser;
  onRefresh: () => void;
}

export default function DataManagement({ currentUser, onRefresh }: Props) {
  const [activeTab, setActiveTab] = useState<'fields' | 'groups' | 'views' | 'labels'>('fields');

  // Stores
  const [fields, setFields] = useState<CustomFieldConfig[]>(() => getStore('customFields', initialCustomFields));
  const [groups, setGroups] = useState<FleetGroupConfig[]>(() => getStore('fleetGroups', initialFleetGroups));
  const [labels, setLabels] = useState<LabelTagConfig[]>(() => getStore('labels', initialLabels));
  const [savedViews, setSavedViews] = useState<SavedViewConfig[]>(() => getStore('savedViews', initialSavedViews));

  // Modals
  const [addFieldModal, setAddFieldModal] = useState(false);
  const [fieldForm, setFieldForm] = useState<Partial<CustomFieldConfig>>({
    entity: 'ASSET',
    fieldName: '',
    fieldType: 'TEXT',
    required: false,
    options: []
  });
  const [optionsInput, setOptionsInput] = useState('');

  const [addGroupModal, setAddGroupModal] = useState(false);
  const [groupForm, setGroupForm] = useState({ name: '', leader: '' });

  const [addLabelModal, setAddLabelModal] = useState(false);
  const [labelForm, setLabelForm] = useState({ name: '', color: '#3b82f6' });

  // Handle Add Custom Field
  const handleAddField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fieldForm.fieldName) return;
    const newF: CustomFieldConfig = {
      id: 'cf-' + Math.random().toString(36).substr(2, 8),
      entity: fieldForm.entity || 'ASSET',
      fieldName: fieldForm.fieldName,
      fieldType: fieldForm.fieldType || 'TEXT',
      required: !!fieldForm.required,
      options: optionsInput ? optionsInput.split(',').map(s => s.trim()) : undefined
    };
    const updated = [...fields, newF];
    setStore('customFields', updated);
    setFields(updated);
    setAddFieldModal(false);
    setFieldForm({ entity: 'ASSET', fieldName: '', fieldType: 'TEXT', required: false, options: [] });
    setOptionsInput('');
    onRefresh();
  };

  // Handle Delete Field
  const handleDeleteField = (id: string) => {
    const updated = fields.filter(f => f.id !== id);
    setStore('customFields', updated);
    setFields(updated);
    onRefresh();
  };

  // Handle Add Group
  const handleAddGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupForm.name) return;
    const newG: FleetGroupConfig = {
      id: 'fg-' + Math.random().toString(36).substr(2, 8),
      name: groupForm.name,
      parentId: 'fg1',
      leader: groupForm.leader || currentUser.name,
      assetCount: 0
    };
    const updated = [...groups, newG];
    setStore('fleetGroups', updated);
    setGroups(updated);
    setAddGroupModal(false);
    setGroupForm({ name: '', leader: '' });
    onRefresh();
  };

  // Handle Add Label
  const handleAddLabel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!labelForm.name) return;
    const newL: LabelTagConfig = {
      id: 'lbl-' + Math.random().toString(36).substr(2, 8),
      name: labelForm.name,
      color: labelForm.color,
      appliedCount: 0
    };
    const updated = [...labels, newL];
    setStore('labels', updated);
    setLabels(updated);
    setAddLabelModal(false);
    setLabelForm({ name: '', color: '#3b82f6' });
    onRefresh();
  };

  // Handle Delete Label
  const handleDeleteLabel = (id: string) => {
    const updated = labels.filter(l => l.id !== id);
    setStore('labels', updated);
    setLabels(updated);
    onRefresh();
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2.5">
            <Layers className="h-6 w-6 text-[#00BA7C]" />
            Data Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Custom fields, organizational groups & subgroups, global saved view presets, and universal color labels.
          </p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
          <button
            onClick={() => setActiveTab('fields')}
            className={`px-3 py-1.5 rounded-lg transition ${activeTab === 'fields' ? 'bg-white text-[#00BA7C] shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Field Management
          </button>
          <button
            onClick={() => setActiveTab('groups')}
            className={`px-3 py-1.5 rounded-lg transition ${activeTab === 'groups' ? 'bg-white text-[#00BA7C] shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Groups & Subgroups
          </button>
          <button
            onClick={() => setActiveTab('views')}
            className={`px-3 py-1.5 rounded-lg transition ${activeTab === 'views' ? 'bg-white text-[#00BA7C] shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Saved Views
          </button>
          <button
            onClick={() => setActiveTab('labels')}
            className={`px-3 py-1.5 rounded-lg transition ${activeTab === 'labels' ? 'bg-white text-[#00BA7C] shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Labels
          </button>
        </div>
      </div>

      {/* ── TAB 1: FIELD MANAGEMENT ── */}
      {activeTab === 'fields' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Custom Domain Fields</h2>
              <p className="text-xs text-slate-500">Extend vehicles, work orders, inspections, and parts with custom enterprise data fields.</p>
            </div>
            <button
              onClick={() => setAddFieldModal(true)}
              className="px-4 py-2 bg-[#00BA7C] hover:bg-[#00BA7C] text-white text-xs font-bold rounded-xl transition flex items-center gap-1"
            >
              <Plus className="h-3.5 w-3.5" /> Add Custom Field
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-4">Target Entity</th>
                  <th className="p-4">Field Label</th>
                  <th className="p-4">Data Type</th>
                  <th className="p-4">Required</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {fields.map(f => (
                  <tr key={f.id} className="hover:bg-slate-50 transition">
                    <td className="p-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                        {f.entity.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-slate-900">{f.fieldName}</td>
                    <td className="p-4 text-slate-600 font-mono text-[11px]">{f.fieldType}</td>
                    <td className="p-4">
                      {f.required ? (
                        <span className="text-rose-600 font-bold text-[11px]">Yes (Mandatory)</span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Optional</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleDeleteField(f.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 transition"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 2: GROUPS & SUBGROUPS ── */}
      {activeTab === 'groups' && (
        <div className="space-y-4 max-w-4xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Organizational Hierarchy</h2>
              <p className="text-xs text-slate-500">Group fleets by regions, terminals, divisions, and operating branches.</p>
            </div>
            <button
              onClick={() => setAddGroupModal(true)}
              className="px-4 py-2 bg-[#00BA7C] hover:bg-[#00BA7C] text-white text-xs font-bold rounded-xl transition flex items-center gap-1"
            >
              <Plus className="h-3.5 w-3.5" /> Add Fleet Group
            </button>
          </div>

          <div className="space-y-3">
            {groups.map(g => (
              <div key={g.id} className="p-4 bg-white border border-slate-200 rounded-xl flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-50 text-[#00BA7C] rounded-lg">
                    <FolderTree className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">{g.name}</h3>
                    <p className="text-xs text-slate-500">Leader: <span className="font-semibold text-slate-700">{g.leader}</span></p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-full">
                  {g.assetCount} Vehicles
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 3: SAVED VIEWS ── */}
      {activeTab === 'views' && (
        <div className="space-y-4 max-w-4xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Shared Saved Views</h2>
              <p className="text-xs text-slate-500">Global filter presets accessible to drivers, mechanics, and dispatchers.</p>
            </div>
          </div>

          <div className="space-y-3">
            {savedViews.map(sv => (
              <div key={sv.id} className="p-4 bg-white border border-slate-200 rounded-xl flex justify-between items-center shadow-sm">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-slate-900">{sv.name}</h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 uppercase">
                      {sv.module}
                    </span>
                  </div>
                  <p className="font-mono text-xs text-slate-500 mt-1">Filters: {sv.filtersJson}</p>
                </div>
                <button
                  onClick={() => alert(`Saved view ${sv.name} applied as active filter.`)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition flex items-center gap-1"
                >
                  <Eye className="h-3 w-3" /> Preview
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 4: LABELS ── */}
      {activeTab === 'labels' && (
        <div className="space-y-4 max-w-4xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Universal Label Taxonomy</h2>
              <p className="text-xs text-slate-500">Color-coded tag markers for vehicles, work orders, parts, and safety certificates.</p>
            </div>
            <button
              onClick={() => setAddLabelModal(true)}
              className="px-4 py-2 bg-[#00BA7C] hover:bg-[#00BA7C] text-white text-xs font-bold rounded-xl transition flex items-center gap-1"
            >
              <Plus className="h-3.5 w-3.5" /> Create Label
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {labels.map(l => (
              <div key={l.id} className="p-4 bg-white border border-slate-200 rounded-xl flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-2.5">
                  <span className="h-3.5 w-3.5 rounded-full" style={{ backgroundColor: l.color }}></span>
                  <div>
                    <h3 className="font-bold text-xs text-slate-900">{l.name}</h3>
                    <p className="text-[10px] text-slate-400">Used on {l.appliedCount} records</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteLabel(l.id)}
                  className="p-1 text-slate-400 hover:text-rose-600 transition"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── MODALS ── */}

      {/* 1. ADD CUSTOM FIELD MODAL */}
      {addFieldModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">Create Custom Field</h3>
              <button onClick={() => setAddFieldModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleAddField} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Target Entity</label>
                <select
                  value={fieldForm.entity}
                  onChange={e => setFieldForm({ ...fieldForm, entity: e.target.value as any })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 font-bold"
                >
                  <option value="ASSET">Vehicles & Assets</option>
                  <option value="WORK_ORDER">Work Orders</option>
                  <option value="PART">Parts & Inventory</option>
                  <option value="INSPECTION">Inspections</option>
                  <option value="CONTACT">Contacts</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Field Label Name</label>
                <input
                  type="text"
                  value={fieldForm.fieldName}
                  onChange={e => setFieldForm({ ...fieldForm, fieldName: e.target.value })}
                  required
                  placeholder="e.g. Warranty Claim Reference #"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Field Data Type</label>
                <select
                  value={fieldForm.fieldType}
                  onChange={e => setFieldForm({ ...fieldForm, fieldType: e.target.value as any })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 font-semibold"
                >
                  <option value="TEXT">Short Text String</option>
                  <option value="NUMBER">Numeric Value</option>
                  <option value="DATE">Calendar Date</option>
                  <option value="DROPDOWN">Dropdown List Options</option>
                  <option value="CHECKBOX">Boolean Checkbox</option>
                </select>
              </div>

              {fieldForm.fieldType === 'DROPDOWN' && (
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Dropdown Options (Comma separated)</label>
                  <input
                    type="text"
                    value={optionsInput}
                    onChange={e => setOptionsInput(e.target.value)}
                    placeholder="e.g. High, Medium, Low, Critical"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900"
                  />
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="reqCheck"
                  checked={fieldForm.required}
                  onChange={e => setFieldForm({ ...fieldForm, required: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-[#00BA7C]"
                />
                <label htmlFor="reqCheck" className="text-xs text-slate-700 font-medium">Require input before saving</label>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAddFieldModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#00BA7C] hover:bg-[#00BA7C] text-white text-xs font-bold rounded-lg transition shadow-sm"
                >
                  Create Field
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. ADD FLEET GROUP MODAL */}
      {addGroupModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">Add Fleet Group</h3>
              <button onClick={() => setAddGroupModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleAddGroup} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Group / Terminal Name</label>
                <input
                  type="text"
                  value={groupForm.name}
                  onChange={e => setGroupForm({ ...groupForm, name: e.target.value })}
                  required
                  placeholder="e.g. West Coast Linehaul Hub"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Terminal Leader / Dispatcher</label>
                <input
                  type="text"
                  value={groupForm.leader}
                  onChange={e => setGroupForm({ ...groupForm, leader: e.target.value })}
                  placeholder="e.g. John Admin"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAddGroupModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#00BA7C] hover:bg-[#00BA7C] text-white text-xs font-bold rounded-lg transition shadow-sm"
                >
                  Save Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. ADD LABEL MODAL */}
      {addLabelModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">Create Tag Label</h3>
              <button onClick={() => setAddLabelModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleAddLabel} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Label Name</label>
                <input
                  type="text"
                  value={labelForm.name}
                  onChange={e => setLabelForm({ ...labelForm, name: e.target.value })}
                  required
                  placeholder="e.g. Hazmat Certified"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Badge Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={labelForm.color}
                    onChange={e => setLabelForm({ ...labelForm, color: e.target.value })}
                    className="h-9 w-12 rounded cursor-pointer border border-slate-200 p-0.5"
                  />
                  <span className="font-mono text-xs text-slate-600">{labelForm.color}</span>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAddLabelModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#00BA7C] hover:bg-[#00BA7C] text-white text-xs font-bold rounded-lg transition shadow-sm"
                >
                  Save Label
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
