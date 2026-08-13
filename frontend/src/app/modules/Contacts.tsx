'use client';
import React, { useState } from 'react';
import { Contact, User as DbUser, getStore, setStore, initialContacts } from '../mockDb';
import { Plus, Phone, Mail, AlertTriangle, Search } from 'lucide-react';

interface Props {
  contacts: Contact[];
  currentUser: DbUser;
  onRefresh: () => void;
}

const roleColors: Record<string, string> = {
  DRIVER: 'bg-blue-500/20 text-blue-300',
  MECHANIC: 'bg-violet-500/20 text-violet-300',
  MAINTENANCE_ADMIN: 'bg-indigo-500/20 text-indigo-300',
  FLEET_MANAGER: 'bg-emerald-500/20 text-emerald-300',
  EXTERNAL_VENDOR: 'bg-amber-500/20 text-amber-300',
  DOT_INSPECTOR: 'bg-red-500/20 text-red-300',
};

const avatarColors = ['bg-indigo-600', 'bg-violet-600', 'bg-blue-600', 'bg-emerald-600', 'bg-rose-600', 'bg-amber-600'];

function daysUntil(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  return Math.floor((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function ExpiryBadge({ days, label }: { days: number | null; label: string }) {
  if (days === null) return null;
  const color = days < 0 ? 'text-red-400 bg-red-500/10' : days < 30 ? 'text-amber-400 bg-amber-500/10' : 'text-green-400 bg-green-500/10';
  return (
    <div className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full ${color}`}>
      {days < 30 && <AlertTriangle className="h-2.5 w-2.5" />}
      {label}: {days < 0 ? `${Math.abs(days)}d expired` : `${days}d`}
    </div>
  );
}

export default function Contacts({ contacts, currentUser, onRefresh }: Props) {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [showForm, setShowForm] = useState(false);
  const [editContact, setEditContact] = useState<Contact | null>(null);
  const [form, setForm] = useState<Partial<Contact>>({
    name: '', role: 'DRIVER', phone: '', email: '',
    cdlNumber: '', cdlExpiry: '', medCardExpiry: '',
    emergencyContactName: '', emergencyContactPhone: ''
  });

  const canManage = ['MAINTENANCE_ADMIN', 'FLEET_MANAGER'].includes(currentUser.role);

  const displayed = contacts
    .filter(c => roleFilter === 'ALL' || c.role === roleFilter)
    .filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase()));

  const handleSubmit = () => {
    if (!form.name || !form.email) { alert('Name and email are required.'); return; }
    const initials = (form.name || '').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    if (editContact) {
      const all = getStore('contacts', initialContacts);
      const updated = all.map(c => c.id === editContact.id ? { ...c, ...form, avatarInitials: initials } : c);
      setStore('contacts', updated);
    } else {
      const newContact: Contact = {
        id: 'con-' + Math.random().toString(36).substr(2, 8),
        userId: null,
        avatarInitials: initials,
        name: form.name!,
        role: form.role as Contact['role'],
        phone: form.phone || '',
        email: form.email!,
        cdlNumber: form.cdlNumber || null,
        cdlExpiry: form.cdlExpiry || null,
        medCardExpiry: form.medCardExpiry || null,
        emergencyContactName: form.emergencyContactName || null,
        emergencyContactPhone: form.emergencyContactPhone || null,
      };
      const all = getStore('contacts', initialContacts);
      all.unshift(newContact);
      setStore('contacts', all);
    }
    setShowForm(false);
    setEditContact(null);
    setForm({ name: '', role: 'DRIVER', phone: '', email: '', cdlNumber: '', cdlExpiry: '', medCardExpiry: '', emergencyContactName: '', emergencyContactPhone: '' });
    onRefresh();
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search contacts..."
              className="bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 font-medium w-48 shadow-xs" />
          </div>
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:border-indigo-600 shadow-xs">
            <option value="ALL">All Roles</option>
            {Object.keys(roleColors).map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
          </select>
        </div>
        {canManage && (
          <button onClick={() => { setShowForm(!showForm); setEditContact(null); }}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold text-white transition shadow-sm">
            <Plus className="h-3.5 w-3.5" /> Add Contact
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 space-y-4">
          <h4 className="text-sm font-bold text-slate-900">{editContact ? 'Edit Contact' : 'New Contact'}</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { label: 'Full Name', key: 'name', type: 'text' },
              { label: 'Email', key: 'email', type: 'email' },
              { label: 'Phone', key: 'phone', type: 'tel' },
              { label: 'CDL Number', key: 'cdlNumber', type: 'text' },
              { label: 'CDL Expiry', key: 'cdlExpiry', type: 'date' },
              { label: 'Med Card Expiry', key: 'medCardExpiry', type: 'date' },
              { label: 'Emergency Contact', key: 'emergencyContactName', type: 'text' },
              { label: 'Emergency Phone', key: 'emergencyContactPhone', type: 'tel' },
            ].map(({ label, key, type }) => (
              <div key={key}>
                <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">{label}</label>
                <input type={type} value={(form as any)[key] || ''} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 font-medium" />
              </div>
            ))}
            <div>
              <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Role</label>
              <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as any }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 font-medium">
                {Object.keys(roleColors).map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => { setShowForm(false); setEditContact(null); }} className="px-3 py-1.5 bg-slate-100 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-200">Cancel</button>
            <button onClick={handleSubmit} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold text-white shadow-sm">{editContact ? 'Update' : 'Add Contact'}</button>
          </div>
        </div>
      )}

      {/* Contact Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {displayed.map((c, i) => {
          const cdlDays = daysUntil(c.cdlExpiry);
          const medDays = daysUntil(c.medCardExpiry);
          const hasAlert = (cdlDays !== null && cdlDays < 30) || (medDays !== null && medDays < 30);
          return (
            <div key={c.id} className={`bg-white border rounded-2xl p-5 space-y-3 shadow-sm hover:shadow-md transition ${hasAlert ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`h-11 w-11 ${avatarColors[i % avatarColors.length]} rounded-2xl flex items-center justify-center text-sm font-black text-white shrink-0 shadow-xs`}>
                    {c.avatarInitials}
                  </div>
                  <div>
                    <p className="font-extrabold text-slate-900 text-sm">{c.name}</p>
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      {c.role.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                {canManage && (
                  <button onClick={() => { setEditContact(c); setForm(c as any); setShowForm(true); }}
                    className="text-[11px] text-indigo-600 hover:text-indigo-700 font-bold transition">Edit</button>
                )}
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 font-medium">
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>{c.phone || 'No phone'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{c.email}</span>
                </div>
              </div>

              {c.cdlNumber && (
                <div className="border-t border-slate-100 pt-3 space-y-2">
                  <p className="text-[10px] text-slate-500 font-semibold">CDL: <span className="text-slate-900 font-bold font-mono">{c.cdlNumber}</span></p>
                  <div className="flex flex-wrap gap-1.5">
                    <ExpiryBadge days={cdlDays} label="CDL" />
                    <ExpiryBadge days={medDays} label="Med Card" />
                  </div>
                </div>
              )}

              {c.emergencyContactName && (
                <div className="text-[10px] text-slate-500 border-t border-slate-100 pt-2 font-medium">
                  Emergency: <span className="text-slate-700 font-bold">{c.emergencyContactName} · {c.emergencyContactPhone}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
