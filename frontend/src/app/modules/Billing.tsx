'use client';
import React, { useState } from 'react';
import {
  BillingProfile,
  PrimaryPlan,
  GeneralSettingsConfig,
  SandboxConfig,
  User as DbUser,
  getSingleStore,
  setSingleStore,
  getStore,
  setStore,
  initialBillingProfile,
  initialPrimaryPlan,
  initialGeneralSettings,
  initialSandboxes
} from '../mockDb';
import {
  CreditCard,
  Building2,
  AlertTriangle,
  CheckCircle,
  Download,
  Shield,
  Layers,
  Settings,
  Edit2,
  RefreshCw,
  Plus,
  Trash2,
  Zap,
  Globe,
  DollarSign,
  Clock,
  Sparkles
} from 'lucide-react';

interface Props {
  currentUser: DbUser;
  onRefresh: () => void;
}

export default function Billing({ currentUser, onRefresh }: Props) {
  const [activeSubTab, setActiveSubTab] = useState<'billing' | 'general' | 'export' | 'sandboxes'>('billing');

  // Stores
  const [profile, setProfile] = useState<BillingProfile>(() => getSingleStore('billingProfile', initialBillingProfile));
  const [plan, setPlan] = useState<PrimaryPlan>(() => getSingleStore('primaryPlan', initialPrimaryPlan));
  const [general, setGeneral] = useState<GeneralSettingsConfig>(() => getSingleStore('generalSettings', initialGeneralSettings));
  const [sandboxes, setSandboxes] = useState<SandboxConfig[]>(() => getStore('sandboxes', initialSandboxes));

  // Modals
  const [editProfileModal, setEditProfileModal] = useState(false);
  const [profileForm, setProfileForm] = useState<BillingProfile>(profile);

  const [buyNowModal, setBuyNowModal] = useState(false);
  const [selectedVehicleTier, setSelectedVehicleTier] = useState(10);

  const [cancelModal, setCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelConfirmed, setCancelConfirmed] = useState(false);

  const [exportNotice, setExportNotice] = useState('');
  const [newSandboxName, setNewSandboxName] = useState('');

  // Handle Profile Save
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSingleStore('billingProfile', profileForm);
    setProfile(profileForm);
    setEditProfileModal(false);
    onRefresh();
  };

  // Handle Buy / Activate Plan
  const handleActivatePlan = () => {
    const updatedPlan: PrimaryPlan = {
      ...plan,
      status: 'ACTIVE',
      currentVehicles: 0,
      maxVehicles: selectedVehicleTier,
      pricePerVehicle: 5.00
    };
    setSingleStore('primaryPlan', updatedPlan);
    setPlan(updatedPlan);
    setBuyNowModal(false);
    onRefresh();
  };

  // Handle Cancel Subscription Request
  const handleCancelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCancelConfirmed(true);
    setTimeout(() => {
      setCancelModal(false);
      setCancelConfirmed(false);
      setCancelReason('');
    }, 1500);
  };

  // Handle General Settings Save
  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    setSingleStore('generalSettings', general);
    alert('General settings updated successfully.');
    onRefresh();
  };

  // Handle Account Export
  const handleExportData = (type: string) => {
    setExportNotice(`Preparing full export for ${type}...`);
    setTimeout(() => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(localStorage, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `fleetcare_export_${type}_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      setExportNotice(`✓ Full ${type} bundle exported successfully!`);
      setTimeout(() => setExportNotice(''), 3000);
    }, 800);
  };

  // Handle Create Sandbox
  const handleAddSandbox = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSandboxName) return;
    const newSb: SandboxConfig = {
      id: 'sb-' + Math.random().toString(36).substr(2, 8),
      name: newSandboxName,
      status: 'ACTIVE',
      createdAt: new Date().toISOString().split('T')[0],
      lastSynced: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString()
    };
    const updated = [...sandboxes, newSb];
    setStore('sandboxes', updated);
    setSandboxes(updated);
    setNewSandboxName('');
    onRefresh();
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Module Header & Sub-Tabs Navigation */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2.5">
            <Building2 className="h-6 w-6 text-[#00BA7C]" />
            Billing & Subscriptions
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your fleet subscription plan, company billing profile, data exports, and sandbox testing environments.
          </p>
        </div>

        {/* Sub navigation pills */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
          <button
            onClick={() => setActiveSubTab('billing')}
            className={`px-3 py-1.5 rounded-lg transition ${activeSubTab === 'billing' ? 'bg-white text-[#00BA7C] shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Billing & Subscriptions
          </button>
          <button
            onClick={() => setActiveSubTab('general')}
            className={`px-3 py-1.5 rounded-lg transition ${activeSubTab === 'general' ? 'bg-white text-[#00BA7C] shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            General Settings
          </button>
          <button
            onClick={() => setActiveSubTab('export')}
            className={`px-3 py-1.5 rounded-lg transition ${activeSubTab === 'export' ? 'bg-white text-[#00BA7C] shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Export Account Data
          </button>
          <button
            onClick={() => setActiveSubTab('sandboxes')}
            className={`px-3 py-1.5 rounded-lg transition ${activeSubTab === 'sandboxes' ? 'bg-white text-[#00BA7C] shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Sandboxes
          </button>
        </div>
      </div>

      {/* ── TAB 1: BILLING & SUBSCRIPTIONS (Exact match of Screenshot 1) ── */}
      {activeSubTab === 'billing' && (
        <div className="space-y-8">
          {/* SECTION 1: PRIMARY PLAN */}
          <div className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900">Primary Plan</h2>
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5 mb-5">
                <div>
                  <h3 className="text-lg font-black text-slate-900">{plan.planName}</h3>
                  <p className="text-xs text-slate-500 font-medium">{plan.billingCycle}</p>
                </div>
                <button
                  onClick={() => setBuyNowModal(true)}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-lg shadow-sm transition flex items-center gap-1.5"
                >
                  <Zap className="h-4 w-4" /> Buy Now
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs text-slate-500 font-semibold mb-1.5">Status</p>
                  <div className="flex items-center gap-2">
                    {plan.status === 'TRIAL_ENDED' ? (
                      <span className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-900">
                        <span className="h-2.5 w-2.5 rounded-full bg-rose-500"></span>
                        Trial Ended
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        Active Subscription
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-xs text-slate-500 font-semibold mb-1.5">Vehicles</p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">
                      {plan.currentVehicles} of {plan.maxVehicles}
                    </span>
                    {plan.maxVehicles === 0 && (
                      <span className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-rose-100 text-rose-600 text-xs font-bold border border-rose-300">
                        !
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: BILLING PROFILE */}
          <div className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900">Billing Profile</h2>
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-5">
                <span className="text-lg font-black text-slate-900">{profile.orgName}</span>
                <button
                  onClick={() => {
                    setProfileForm(profile);
                    setEditProfileModal(true);
                  }}
                  className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 rounded-lg transition flex items-center gap-1"
                >
                  <Edit2 className="h-3 w-3" /> Edit
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
                <div>
                  <p className="text-xs text-slate-500 font-semibold mb-1">Contact</p>
                  <p className="font-bold text-slate-900">{profile.contactName}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-semibold mb-1">Email</p>
                  <a href={`mailto:${profile.email}`} className="text-emerald-700 font-medium hover:underline">
                    {profile.email}
                  </a>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-semibold mb-1">Tax / VAT ID</p>
                  <p className="font-mono text-slate-700">{profile.taxId}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-semibold mb-1">Payment Method</p>
                  <p className="font-medium text-slate-800 flex items-center gap-1.5">
                    <CreditCard className="h-4 w-4 text-slate-500" />
                    {profile.paymentMethod}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: ACCOUNT CANCELLATION */}
          <div className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900">Account Cancellation</h2>
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
              <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                You can submit a cancellation request for your account at any time. We will review your request, confirm whether your account is eligible to cancel under your contract terms, and follow up if needed. If there's anything we can do to help, please contact{' '}
                <a href="mailto:help@fleetio.com" className="text-emerald-700 font-semibold hover:underline">
                  help@fleetio.com
                </a>
              </p>

              <div>
                <button
                  onClick={() => setCancelModal(true)}
                  className="px-4 py-2 bg-white hover:bg-rose-50 border border-rose-300 text-rose-600 text-xs font-bold rounded-lg transition shadow-sm"
                >
                  Cancel all subscriptions
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: GENERAL SETTINGS ── */}
      {activeSubTab === 'general' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm max-w-3xl">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Organization Profile & Defaults</h2>
          <form onSubmit={handleSaveGeneral} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Company / Organization Name</label>
              <input
                type="text"
                value={general.companyName}
                onChange={e => setGeneral({ ...general, companyName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#00BA7C]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Primary Timezone</label>
                <select
                  value={general.timezone}
                  onChange={e => setGeneral({ ...general, timezone: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900"
                >
                  <option value="America/Chicago (CST)">America/Chicago (CST - UTC-6)</option>
                  <option value="America/New_York (EST)">America/New_York (EST - UTC-5)</option>
                  <option value="America/Los_Angeles (PST)">America/Los_Angeles (PST - UTC-8)</option>
                  <option value="Europe/London (GMT)">Europe/London (GMT - UTC+0)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Date Format</label>
                <select
                  value={general.dateFormat}
                  onChange={e => setGeneral({ ...general, dateFormat: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900"
                >
                  <option value="MM/DD/YYYY">MM/DD/YYYY (12/31/2026)</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY (31/12/2026)</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD (2026-12-31)</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Base Currency</label>
                <select
                  value={general.baseCurrency}
                  onChange={e => setGeneral({ ...general, baseCurrency: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900"
                >
                  <option value="USD ($)">USD ($) - US Dollar</option>
                  <option value="CAD ($)">CAD ($) - Canadian Dollar</option>
                  <option value="EUR (€)">EUR (€) - Euro</option>
                  <option value="GBP (£)">GBP (£) - British Pound</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Unit System</label>
                <select
                  value={general.unitSystem}
                  onChange={e => setGeneral({ ...general, unitSystem: e.target.value as any })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900"
                >
                  <option value="IMPERIAL">US Imperial (Miles, Gallons, PSI)</option>
                  <option value="METRIC">Metric (Kilometers, Liters, Bar)</option>
                </select>
              </div>
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#00BA7C] hover:bg-[#00BA7C] text-white text-xs font-bold rounded-lg transition shadow-sm"
            >
              Save Organization Settings
            </button>
          </form>
        </div>
      )}

      {/* ── TAB 3: EXPORT ACCOUNT DATA ── */}
      {activeSubTab === 'export' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 max-w-3xl">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Export Complete Account Data</h2>
            <p className="text-xs text-slate-500 mt-1">
              Download your complete fleet data archive including vehicles, work orders, inspections, fuel records, and parts.
            </p>
          </div>

          {exportNotice && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-lg flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-600" />
              {exportNotice}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 border border-slate-200 rounded-xl space-y-2 bg-slate-50">
              <h3 className="font-bold text-sm text-slate-900">Full JSON Backup</h3>
              <p className="text-xs text-slate-500">Includes all database models, settings, and full system configuration state.</p>
              <button
                onClick={() => handleExportData('full_database')}
                className="w-full py-2 bg-[#00BA7C] hover:bg-[#00BA7C] text-white text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5"
              >
                <Download className="h-3.5 w-3.5" /> Download JSON Backup
              </button>
            </div>

            <div className="p-4 border border-slate-200 rounded-xl space-y-2 bg-slate-50">
              <h3 className="font-bold text-sm text-slate-900">IFTA & Financial CSV Bundle</h3>
              <p className="text-xs text-slate-500">Export all fuel fill-ups, toll transactions, and work order expenses.</p>
              <button
                onClick={() => handleExportData('financial_csv')}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5"
              >
                <Download className="h-3.5 w-3.5" /> Download Financial CSVs
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: SANDBOXES ── */}
      {activeSubTab === 'sandboxes' && (
        <div className="space-y-6 max-w-4xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Sandbox Environments</h2>
              <p className="text-xs text-slate-500">Test API integrations, telematics webhooks, and driver workflows without affecting live data.</p>
            </div>
          </div>

          <form onSubmit={handleAddSandbox} className="p-4 bg-white border border-slate-200 rounded-2xl flex gap-3">
            <input
              type="text"
              value={newSandboxName}
              onChange={e => setNewSandboxName(e.target.value)}
              placeholder="e.g. Telematics Test Sandbox"
              className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#00BA7C]"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-[#00BA7C] hover:bg-[#00BA7C] text-white text-xs font-bold rounded-lg transition flex items-center gap-1"
            >
              <Plus className="h-3.5 w-3.5" /> Create Sandbox
            </button>
          </form>

          <div className="space-y-3">
            {sandboxes.map(sb => (
              <div key={sb.id} className="p-4 bg-white border border-slate-200 rounded-xl flex justify-between items-center shadow-sm">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{sb.name}</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${sb.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                      {sb.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Created: {sb.createdAt} &bull; Last Synced: {sb.lastSynced}</p>
                </div>
                <button
                  onClick={() => alert(`Sandbox ${sb.name} refreshed from live production snapshot.`)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition flex items-center gap-1"
                >
                  <RefreshCw className="h-3 w-3" /> Sync Live Data
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── MODALS ── */}

      {/* 1. EDIT BILLING PROFILE MODAL */}
      {editProfileModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">Edit Billing Profile</h3>
              <button onClick={() => setEditProfileModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleSaveProfile} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Organization / Account Name</label>
                <input
                  type="text"
                  value={profileForm.orgName}
                  onChange={e => setProfileForm({ ...profileForm, orgName: e.target.value })}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold text-slate-900"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Billing Contact Person</label>
                <input
                  type="text"
                  value={profileForm.contactName}
                  onChange={e => setProfileForm({ ...profileForm, contactName: e.target.value })}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold text-slate-900"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Billing Email Address</label>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={e => setProfileForm({ ...profileForm, email: e.target.value })}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold text-slate-900"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Tax ID / VAT Registration Number</label>
                <input
                  type="text"
                  value={profileForm.taxId}
                  onChange={e => setProfileForm({ ...profileForm, taxId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold text-slate-900"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Registered Billing Address</label>
                <input
                  type="text"
                  value={profileForm.address}
                  onChange={e => setProfileForm({ ...profileForm, address: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold text-slate-900"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditProfileModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#00BA7C] hover:bg-[#00BA7C] text-white text-xs font-bold rounded-lg transition"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. BUY NOW / UPGRADE MODAL */}
      {buyNowModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">Select Subscription Tier</h3>
              <button onClick={() => setBuyNowModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-600">Select your active vehicle capacity tier. Includes eDVIR inspections, dual PM reminders, DTC telematics webhooks, and fuel IFTA reporting.</p>

              <div className="space-y-2">
                {[
                  { tier: 5, label: '5 Vehicles Tier', price: '$25 / mo (Billed Annually)' },
                  { tier: 10, label: '10 Vehicles Tier (Recommended)', price: '$50 / mo (Billed Annually)' },
                  { tier: 25, label: '25 Vehicles Enterprise Tier', price: '$125 / mo (Billed Annually)' }
                ].map(opt => (
                  <button
                    key={opt.tier}
                    type="button"
                    onClick={() => setSelectedVehicleTier(opt.tier)}
                    className={`w-full p-3 rounded-xl border text-left transition flex justify-between items-center ${selectedVehicleTier === opt.tier ? 'border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-500' : 'border-slate-200 hover:bg-slate-50'}`}
                  >
                    <div>
                      <p className="font-bold text-slate-900">{opt.label}</p>
                      <p className="text-slate-500 text-[11px]">{opt.price}</p>
                    </div>
                    {selectedVehicleTier === opt.tier && (
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                    )}
                  </button>
                ))}
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
                <div className="flex justify-between font-bold text-slate-900">
                  <span>Total Due Today:</span>
                  <span>${selectedVehicleTier * 5 * 12}.00 / year</span>
                </div>
                <p className="text-slate-400">Card on file: {profile.paymentMethod}</p>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setBuyNowModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleActivatePlan}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition shadow-sm flex items-center gap-1"
                >
                  <CheckCircle className="h-3.5 w-3.5" /> Confirm & Activate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. CANCEL ALL SUBSCRIPTIONS MODAL */}
      {cancelModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-rose-600 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" /> Cancel Subscriptions
              </h3>
              <button onClick={() => setCancelModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            {cancelConfirmed ? (
              <div className="py-6 text-center space-y-2">
                <CheckCircle className="h-8 w-8 text-emerald-600 mx-auto animate-bounce" />
                <h4 className="font-bold text-sm text-slate-900">Cancellation Request Submitted</h4>
                <p className="text-xs text-slate-500">Our success team will contact {profile.email} within 1 business day.</p>
              </div>
            ) : (
              <form onSubmit={handleCancelSubmit} className="space-y-3">
                <p className="text-xs text-slate-600">
                  Please let us know why you are submitting a cancellation request for organization <strong>{profile.orgName}</strong>:
                </p>
                <textarea
                  value={cancelReason}
                  onChange={e => setCancelReason(e.target.value)}
                  required
                  rows={3}
                  placeholder="e.g. Downsizing fleet, switching software, temporary pause..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none focus:border-rose-500"
                />

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setCancelModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition"
                  >
                    Keep Subscription
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg transition shadow-sm"
                  >
                    Submit Request
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
