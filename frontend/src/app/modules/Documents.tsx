'use client';
import React, { useState } from 'react';
import { FleetDocument, Asset, User as DbUser, getStore, setStore, initialDocuments } from '../mockDb';
import { Plus, FileText, Download, AlertTriangle, Search } from 'lucide-react';

interface Props {
  documents: FleetDocument[];
  assets: Asset[];
  currentUser: DbUser;
  onRefresh: () => void;
}

const typeConfig: Record<string, { label: string; color: string }> = {
  INSURANCE_CARD: { label: 'Insurance', color: 'bg-blue-500/20 text-blue-300' },
  REGISTRATION: { label: 'Registration', color: 'bg-violet-500/20 text-violet-300' },
  INSPECTION_CERT: { label: 'Inspection Cert', color: 'bg-green-500/20 text-green-300' },
  CDL_SCAN: { label: 'CDL Scan', color: 'bg-amber-500/20 text-amber-300' },
  ACCIDENT_REPORT: { label: 'Accident Report', color: 'bg-red-500/20 text-red-300' },
  WARRANTY_CERT: { label: 'Warranty', color: 'bg-indigo-500/20 text-indigo-300' },
  OTHER: { label: 'Other', color: 'bg-slate-600 text-slate-300' },
};

function daysUntil(dateStr: string | null | undefined) {
  if (!dateStr) return null;
  return Math.floor((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export default function Documents({ documents, assets, currentUser, onRefresh }: Props) {
  const [search, setSearch] = useState('');
  const [assetFilter, setAssetFilter] = useState('ALL');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    assetId: assets[0]?.id || '',
    name: '',
    type: 'REGISTRATION' as FleetDocument['type'],
    expiresAt: '',
  });

  const canManage = ['MAINTENANCE_ADMIN', 'FLEET_MANAGER'].includes(currentUser.role);

  const expiringSoon = documents.filter(d => {
    const days = daysUntil(d.expiresAt);
    return days !== null && days < 30 && days >= 0;
  }).length;
  const expired = documents.filter(d => {
    const days = daysUntil(d.expiresAt);
    return days !== null && days < 0;
  }).length;

  const displayed = documents
    .filter(d => assetFilter === 'ALL' || d.assetId === assetFilter)
    .filter(d => !search || d.name.toLowerCase().includes(search.toLowerCase()));

  const handleSubmit = () => {
    if (!form.name) { alert('Document name is required.'); return; }
    const newDoc: FleetDocument = {
      id: 'doc-' + Math.random().toString(36).substr(2, 8),
      assetId: form.assetId,
      name: form.name,
      type: form.type,
      fileUrl: `https://example.com/docs/${form.name.replace(/\s+/g, '-').toLowerCase()}.pdf`,
      uploadedBy: currentUser.name,
      uploadedAt: new Date().toISOString(),
      expiresAt: form.expiresAt || null,
    };
    const all = getStore('documents', initialDocuments);
    all.unshift(newDoc);
    setStore('documents', all);
    setShowForm(false);
    setForm({ assetId: assets[0]?.id || '', name: '', type: 'REGISTRATION', expiresAt: '' });
    onRefresh();
  };

  return (
    <div className="space-y-6">
      {/* Alerts */}
      {(expiringSoon > 0 || expired > 0) && (
        <div className="flex gap-3 flex-wrap">
          {expired > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-bold">
              <AlertTriangle className="h-4 w-4" /> {expired} document{expired > 1 ? 's' : ''} expired
            </div>
          )}
          {expiringSoon > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 font-bold">
              <AlertTriangle className="h-4 w-4" /> {expiringSoon} expiring within 30 days
            </div>
          )}
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search documents..."
              className="bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 font-medium w-48 shadow-xs" />
          </div>
          <select value={assetFilter} onChange={e => setAssetFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:border-indigo-600 shadow-xs">
            <option value="ALL">All Assets</option>
            {assets.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
        {canManage && (
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold text-white transition shadow-sm">
            <Plus className="h-3.5 w-3.5" /> Upload Document
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 space-y-4">
          <h4 className="text-sm font-bold text-slate-900">Upload New Document</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Asset</label>
              <select value={form.assetId} onChange={e => setForm(f => ({ ...f, assetId: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 font-medium">
                {assets.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as any }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 font-medium">
                {Object.entries(typeConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Document Name</label>
              <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Insurance Card 2026"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 font-medium" />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Expiry Date</label>
              <input type="date" value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 font-medium" />
            </div>
          </div>
          <div className="text-[10px] text-slate-600 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium">
            📁 File upload simulated — document will be recorded in the vault. In production, this would upload to cloud storage.
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowForm(false)} className="px-3 py-1.5 bg-slate-100 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-200">Cancel</button>
            <button onClick={handleSubmit} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold text-white shadow-sm">Save Document</button>
          </div>
        </div>
      )}

      {/* Document Table */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[10px] text-slate-500 uppercase font-bold border-b border-slate-200 bg-slate-50">
                <th className="text-left px-4 py-3">Document</th>
                <th className="text-left px-4 py-3">Asset</th>
                <th className="text-left px-4 py-3">Type</th>
                <th className="text-left px-4 py-3">Uploaded By</th>
                <th className="text-left px-4 py-3">Upload Date</th>
                <th className="text-left px-4 py-3">Expires</th>
                <th className="text-left px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayed.map(doc => {
                const asset = assets.find(a => a.id === doc.assetId);
                const days = daysUntil(doc.expiresAt);
                const expiryClass = days === null ? '' : days < 0 ? 'text-red-600' : days < 30 ? 'text-amber-600' : 'text-green-700';
                const typeCfg = typeConfig[doc.type] || typeConfig.OTHER;
                return (
                  <tr key={doc.id} className={`hover:bg-slate-50 ${days !== null && days < 0 ? 'bg-red-50/50' : days !== null && days < 30 ? 'bg-amber-50/50' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <FileText className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="text-slate-900 font-bold">{doc.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700 font-bold text-[10px]">{asset?.name || doc.assetId}</td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-slate-100 text-slate-700 border border-slate-200">{typeCfg.label}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-medium">{doc.uploadedBy}</td>
                    <td className="px-4 py-3 text-slate-500 font-medium">{new Date(doc.uploadedAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      {doc.expiresAt ? (
                        <span className={`flex items-center gap-1 font-bold ${expiryClass}`}>
                          {days !== null && days < 30 && <AlertTriangle className="h-3 w-3" />}
                          {doc.expiresAt}
                          {days !== null && <span className="text-[10px] opacity-80">({days < 0 ? `${Math.abs(days)}d ago` : `${days}d`})</span>}
                        </span>
                      ) : <span className="text-slate-400 font-medium">No expiry</span>}
                    </td>
                    <td className="px-4 py-3">
                      <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700 transition text-[11px] font-bold">
                        <Download className="h-3.5 w-3.5" /> View
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
