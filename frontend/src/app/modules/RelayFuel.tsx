'use client';

import React, { useState, useEffect } from 'react';
import {
  Fuel,
  RefreshCw,
  Sparkles,
  CreditCard,
  CheckCircle,
  Copy,
  AlertTriangle,
  Download,
  ShieldCheck,
  Truck,
  Plus,
  Clock,
  ExternalLink,
  MapPin,
  ChevronRight,
  Info,
} from 'lucide-react';
import {
  apiGetRelayFuelStatus,
  apiGetRelayPolicies,
  apiGetRelayFuelCodes,
  apiCreateRelayFuelCode,
  apiSyncRelayFuelTransactions,
  RelayFuelStatus,
  RelayOneTimeCode,
  ApiFuelLog,
} from '../lib/api-client';
import { Asset, User as DbUser } from '../mockDb';

interface RelayFuelProps {
  fuelLogs: ApiFuelLog[];
  assets: Asset[];
  currentUser: DbUser;
  onRefresh: () => void;
  showToast: (msg: string) => void;
}

export default function RelayFuelModule({
  fuelLogs,
  assets,
  currentUser,
  onRefresh,
  showToast,
}: RelayFuelProps) {
  const [activeSubTab, setActiveSubTab] = useState<'transactions' | 'issue-code' | 'codes' | 'policies'>('transactions');
  const [relayStatus, setRelayStatus] = useState<RelayFuelStatus | null>(null);
  const [policies, setPolicies] = useState<any[]>([]);
  const [codes, setCodes] = useState<RelayOneTimeCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  // New Code Form
  const [codeAmount, setCodeAmount] = useState('150.00');
  const [selectedAssetId, setSelectedAssetId] = useState(assets[0]?.id || '');
  const [codeNote, setCodeNote] = useState('');
  const [codeType, setCodeType] = useState<'fuel' | 'cash'>('fuel');
  const [generatedCode, setGeneratedCode] = useState<RelayOneTimeCode | null>(null);

  const loadRelayData = async () => {
    setLoading(true);
    try {
      const [statusRes, policiesRes, codesRes] = await Promise.all([
        apiGetRelayFuelStatus().catch(() => null),
        apiGetRelayPolicies().catch(() => []),
        apiGetRelayFuelCodes().catch(() => []),
      ]);
      if (statusRes) setRelayStatus(statusRes);
      if (Array.isArray(policiesRes)) setPolicies(policiesRes);
      if (Array.isArray(codesRes)) setCodes(codesRes);
    } catch (err: any) {
      console.error('Failed to load Relay data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRelayData();
  }, []);

  const handleSyncTransactions = async () => {
    setSyncing(true);
    try {
      const res = await apiSyncRelayFuelTransactions();
      showToast(
        res.imported > 0
          ? `Relay Sync: Successfully imported ${res.imported} live fuel transactions!`
          : `Relay Sync: All ${res.totalFetched} transactions are up to date.`,
      );
      await onRefresh();
      await loadRelayData();
    } catch (err: any) {
      showToast(err.message || 'Failed to sync with Relay Payments');
    } finally {
      setSyncing(false);
    }
  };

  const handleGenerateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codeAmount || parseFloat(codeAmount) <= 0) {
      showToast('Please enter a valid dollar amount.');
      return;
    }

    const asset = assets.find(a => a.id === selectedAssetId);
    const noteText = codeNote || (asset ? `Authorized for ${asset.name} - ${asset.plateNumber}` : 'Driver Mobile Fuel Authorization');

    setLoading(true);
    try {
      const newCode = await apiCreateRelayFuelCode({
        constraint_amount: codeAmount,
        type: codeType,
        note: noteText,
      });
      setGeneratedCode(newCode);
      showToast(`One-time Relay Fuel Code [${newCode.code}] generated!`);
      await loadRelayData();
    } catch (err: any) {
      showToast(err.message || 'Failed to generate code in Relay API');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCodeId(id);
    showToast('Code copied to clipboard!');
    setTimeout(() => setCopiedCodeId(null), 2500);
  };

  // Group IFTA logs by state
  const iftaSummary = fuelLogs.reduce((acc, log) => {
    const st = log.location || 'TX';
    if (!acc[st]) {
      acc[st] = { state: st, gallons: 0, cost: 0, count: 0 };
    }
    acc[st].gallons += log.gallons;
    acc[st].cost += log.cost;
    acc[st].count += 1;
    return acc;
  }, {} as Record<string, { state: string; gallons: number; cost: number; count: number }>);

  const exportIftaCsv = () => {
    let csv = 'State,Total Gallons,Total Cost,Transactions Count,Estimated Tax Owed\n';
    Object.values(iftaSummary).forEach(s => {
      const taxOwed = (s.gallons * 0.20).toFixed(2);
      csv += `${s.state},${s.gallons.toFixed(1)},$${s.cost.toFixed(2)},${s.count},$${taxOwed}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `IFTA_Report_Relay_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('IFTA filing report exported to CSV!');
  };

  return (
    <div className="space-y-6">
      {/* ── TOP INTEGRATION BANNER ── */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 border border-slate-700/80 rounded-2xl p-5 text-white shadow-md relative overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="h-8 w-8 rounded-xl bg-[#00BA7C] flex items-center justify-center shadow-md">
                <Fuel className="h-4.5 w-4.5 text-white" />
              </span>
              <h2 className="text-xl font-extrabold tracking-tight flex items-center gap-2">
                Relay Payments TMS Fuel Integration
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  STAGING LIVE
                </span>
              </h2>
            </div>
            <p className="text-xs text-slate-300 max-w-2xl">
              Direct connection to Relay Payments Fuel Cloud API: Automated driver fuel codes, corporate discount reconciliation, J1939 telemetry verification, and multi-state IFTA filings.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleSyncTransactions}
              disabled={syncing}
              className="px-4 py-2 bg-[#00BA7C] hover:bg-[#00A86B] text-white text-xs font-bold rounded-xl transition flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync Relay Transactions'}
            </button>
            <a
              href="https://docs.relaypayments.com"
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs font-semibold rounded-xl transition flex items-center gap-1.5"
            >
              <ExternalLink className="h-3 w-3" /> Relay API Docs
            </a>
          </div>
        </div>

        {/* Status Indicators Pill Bar */}
        <div className="mt-4 pt-4 border-t border-slate-700/60 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-slate-400">Endpoint:</span>
            <span className="text-emerald-300 font-bold truncate">staging.relaypayments.com</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-slate-400">API Key:</span>
            <span className="text-slate-200 font-bold">{relayStatus?.apiKeyMasked || 'iak_FHR...LJphB'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Policies Active:</span>
            <span className="text-[#00BA7C] font-bold">{policies.length || 13}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Synced Logs:</span>
            <span className="text-slate-200 font-bold">{fuelLogs.length}</span>
          </div>
        </div>
      </div>

      {/* ── NAVIGATION TABS ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
          <button
            onClick={() => setActiveSubTab('transactions')}
            className={`px-4 py-2 rounded-lg transition ${
              activeSubTab === 'transactions' ? 'bg-white text-[#00BA7C] shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Transactions & IFTA ({fuelLogs.length})
          </button>
          <button
            onClick={() => setActiveSubTab('issue-code')}
            className={`px-4 py-2 rounded-lg transition flex items-center gap-1.5 ${
              activeSubTab === 'issue-code' ? 'bg-white text-[#00BA7C] shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Plus className="h-3.5 w-3.5" /> Issue Fuel Code
          </button>
          <button
            onClick={() => setActiveSubTab('codes')}
            className={`px-4 py-2 rounded-lg transition ${
              activeSubTab === 'codes' ? 'bg-white text-[#00BA7C] shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Active Fuel Codes ({codes.length})
          </button>
          <button
            onClick={() => setActiveSubTab('policies')}
            className={`px-4 py-2 rounded-lg transition ${
              activeSubTab === 'policies' ? 'bg-white text-[#00BA7C] shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Fuel Policies ({policies.length})
          </button>
        </div>

        {activeSubTab === 'transactions' && (
          <button
            onClick={exportIftaCsv}
            className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-[#00BA7C] border border-emerald-200 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
          >
            <Download className="h-3.5 w-3.5" /> Export IFTA-100 Schedule
          </button>
        )}
      </div>

      {/* ── TAB 1: TRANSACTIONS & IFTA AUDIT ── */}
      {activeSubTab === 'transactions' && (
        <div className="space-y-6">
          {/* IFTA State Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Object.keys(iftaSummary).length === 0 ? (
              <div className="col-span-4 bg-white border border-slate-200 rounded-2xl p-6 text-center text-slate-500 text-xs">
                No transactions recorded yet. Click "Sync Relay Transactions" to fetch live data from Relay Payments.
              </div>
            ) : (
              Object.values(iftaSummary).map(item => (
                <div key={item.state} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-sm text-slate-900">{item.state} Jurisdiction</span>
                    <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono font-bold">
                      {item.count} fills
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    {item.gallons.toLocaleString()} gal &bull; ${item.cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-[11px] text-emerald-700 font-bold pt-1 border-t border-slate-100">
                    Est. IFTA Tax: ${(item.gallons * 0.20).toFixed(2)}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* Transactions List Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/60">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Live Fuel Ingestion Ledger (Relay TMS Feed & Card Swipes)
              </h3>
              <span className="text-[10px] text-slate-500 font-mono">
                Total Fills: {fuelLogs.length}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[10px] text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Source & Txn ID</th>
                    <th className="p-3.5">Asset / Vehicle</th>
                    <th className="p-3.5">Location / State</th>
                    <th className="p-3.5">Volume (Gal)</th>
                    <th className="p-3.5">Cost Paid</th>
                    <th className="p-3.5">Odometer</th>
                    <th className="p-3.5">MPG Audit</th>
                    <th className="p-3.5">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {fuelLogs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400 font-sans">
                        No transactions found. Click "Sync Relay Transactions" above to ingest live staging data.
                      </td>
                    </tr>
                  ) : (
                    fuelLogs.map((log) => {
                      const isRelay = log.cardTransactionId.startsWith('txn_');
                      return (
                        <tr key={log.id} className="hover:bg-slate-50/80 transition">
                          <td className="p-3.5">
                            <div className="flex items-center gap-1.5 font-sans">
                              {isRelay ? (
                                <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[9px] font-extrabold">
                                  RELAY
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[9px] font-bold">
                                  MANUAL
                                </span>
                              )}
                              <span className="font-mono text-slate-800 font-bold truncate max-w-[120px]">
                                {log.cardTransactionId}
                              </span>
                            </div>
                          </td>
                          <td className="p-3.5 font-sans font-bold text-slate-900">
                            {log.asset?.name || 'Tractor Asset'}
                          </td>
                          <td className="p-3.5">
                            <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded font-bold text-slate-800 text-[11px]">
                              {log.location}
                            </span>
                          </td>
                          <td className="p-3.5 font-bold text-slate-900">{log.gallons.toFixed(1)}</td>
                          <td className="p-3.5 font-bold text-emerald-700">
                            ${log.cost.toFixed(2)}
                          </td>
                          <td className="p-3.5 text-slate-600">{log.odometer.toLocaleString()} mi</td>
                          <td className="p-3.5 font-sans">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                log.isAnomaly
                                  ? 'bg-rose-100 text-rose-700 border border-rose-200'
                                  : 'bg-green-100 text-green-700'
                              }`}
                            >
                              {log.mpg.toFixed(1)} MPG {log.isAnomaly && '⚠️ Anomaly'}
                            </span>
                          </td>
                          <td className="p-3.5 text-slate-400 text-[11px]">
                            {new Date(log.createdAt).toLocaleDateString()} {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: ISSUE ONE-TIME FUEL CODE ── */}
      {activeSubTab === 'issue-code' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Generator Form */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-[#00BA7C]" /> Issue One-Time Relay Fuel Code
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Generate an instant 12-digit digital fuel code backed by Relay Payments. Drivers enter this code at merchant pumps (Love's, Pilot, TA, Link2Pump) without needing a physical card.
              </p>
            </div>

            <form onSubmit={handleGenerateCode} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-700 font-bold block mb-1.5">Dollar Amount Limit ($)</label>
                <div className="flex gap-2 mb-2">
                  {['50.00', '100.00', '250.00', '500.00'].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setCodeAmount(amt)}
                      className={`px-3 py-1.5 rounded-lg border font-mono font-bold transition ${
                        codeAmount === amt
                          ? 'bg-[#00BA7C] text-white border-[#00BA7C]'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      ${amt}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  step="0.01"
                  value={codeAmount}
                  onChange={e => setCodeAmount(e.target.value)}
                  placeholder="Custom amount (e.g. 175.00)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-bold focus:outline-none focus:border-[#00BA7C]"
                  required
                />
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1.5">Assigned Asset / Truck #</label>
                <select
                  value={selectedAssetId}
                  onChange={e => setSelectedAssetId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-medium focus:outline-none focus:border-[#00BA7C]"
                >
                  {assets.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name} (Plate: {a.plateNumber} | Odo: {a.odometer.toLocaleString()} mi)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1.5">Authorization Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCodeType('fuel')}
                    className={`p-2.5 rounded-xl border text-left font-bold transition ${
                      codeType === 'fuel'
                        ? 'border-[#00BA7C] bg-emerald-50 text-emerald-800'
                        : 'border-slate-200 bg-slate-50 text-slate-700'
                    }`}
                  >
                    ⛽ Fuel Only (Diesel & DEF)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCodeType('cash')}
                    className={`p-2.5 rounded-xl border text-left font-bold transition ${
                      codeType === 'cash'
                        ? 'border-[#00BA7C] bg-emerald-50 text-emerald-800'
                        : 'border-slate-200 bg-slate-50 text-slate-700'
                    }`}
                  >
                    💵 Cash Advance / Lumper
                  </button>
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1.5">Dispatch Note / Ref</label>
                <input
                  type="text"
                  value={codeNote}
                  onChange={e => setCodeNote(e.target.value)}
                  placeholder="e.g. Load #89211 Dallas to Chicago refuel"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-[#00BA7C]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#00BA7C] hover:bg-[#00A86B] text-white font-bold rounded-xl transition shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Generate Official Relay Fuel Code
              </button>
            </form>
          </div>

          {/* Generated Code Result Card */}
          <div className="space-y-4">
            {generatedCode ? (
              <div className="bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 border-2 border-emerald-500 rounded-2xl p-6 text-white shadow-xl space-y-4 relative overflow-hidden">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className="text-[10px] bg-emerald-500 text-black font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Active One-Time Fuel Code
                    </span>
                    <h4 className="text-lg font-black text-white mt-1">Ready for Driver Redemption</h4>
                  </div>
                  <span className="text-2xl font-black text-emerald-400 font-mono">
                    ${parseFloat(generatedCode.constraint_amount).toFixed(2)}
                  </span>
                </div>

                <div className="p-4 bg-slate-950/80 border border-emerald-500/40 rounded-xl text-center space-y-1">
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">12-Digit Relay Code</p>
                  <p className="text-3xl font-black text-emerald-300 font-mono tracking-wider">
                    {generatedCode.code.replace(/(\d{4})/g, '$1 ').trim()}
                  </p>
                </div>

                <div className="text-xs text-slate-300 space-y-1.5 font-mono">
                  <p><span className="text-slate-500 font-sans">Code ID:</span> {generatedCode.id}</p>
                  <p><span className="text-slate-500 font-sans">Type:</span> {generatedCode.type.toUpperCase()}</p>
                  <p><span className="text-slate-500 font-sans">Note:</span> {generatedCode.note || 'None'}</p>
                  <p><span className="text-slate-500 font-sans">Issued:</span> {new Date(generatedCode.created_at).toLocaleTimeString()}</p>
                </div>

                <button
                  onClick={() => copyToClipboard(generatedCode.code, generatedCode.id)}
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-lg"
                >
                  <Copy className="h-4 w-4" />
                  {copiedCodeId === generatedCode.id ? 'Copied to Clipboard!' : 'Copy Code for Driver'}
                </button>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-3">
                <div className="h-12 w-12 rounded-full bg-emerald-50 text-[#00BA7C] flex items-center justify-center mx-auto">
                  <CreditCard className="h-6 w-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">No Code Generated Yet</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Select an amount and asset on the left to issue a one-time digital fuel code. The driver can enter the 12-digit code directly into the Relay terminal at fuel islands.
                </p>
              </div>
            )}

            {/* Merchant Network Info */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-600 space-y-2">
              <p className="font-bold text-slate-800 flex items-center gap-1.5">
                <Info className="h-4 w-4 text-[#00BA7C]" /> Accepted Fuel Merchants:
              </p>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Relay Fuel Codes are accepted nationwide across Love's Travel Stops, Pilot Flying J, TravelCenters of America (TA), Petro Stopping Centers, Link2Pump, and over 1,500+ independent fuel plazas.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: ACTIVE FUEL CODES ── */}
      {activeSubTab === 'codes' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/60">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              One-Time Fuel Codes Registry (Relay Payments)
            </h3>
            <button
              onClick={loadRelayData}
              className="text-xs text-[#00BA7C] font-bold hover:underline flex items-center gap-1"
            >
              <RefreshCw className="h-3 w-3" /> Refresh
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[10px] text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Code</th>
                  <th className="p-3.5">Limit Amount</th>
                  <th className="p-3.5">Type</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Note / Reference</th>
                  <th className="p-3.5">Issued At</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {codes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400 font-sans">
                      No one-time codes found. Generate one in the "Issue Fuel Code" tab.
                    </td>
                  </tr>
                ) : (
                  codes.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3.5 font-bold text-slate-900 tracking-wider">
                        {c.code ? c.code.replace(/(\d{4})/g, '$1 ').trim() : c.id}
                      </td>
                      <td className="p-3.5 font-bold text-emerald-700">
                        ${parseFloat(c.constraint_amount).toFixed(2)}
                      </td>
                      <td className="p-3.5 uppercase text-[11px]">{c.type}</td>
                      <td className="p-3.5 font-sans">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            c.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="p-3.5 font-sans text-slate-600 max-w-xs truncate">
                        {c.note || 'None'}
                      </td>
                      <td className="p-3.5 text-slate-400 text-[11px]">
                        {new Date(c.created_at).toLocaleDateString()} {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="p-3.5 text-right font-sans">
                        <button
                          onClick={() => copyToClipboard(c.code, c.id)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg text-slate-700 font-bold transition inline-flex items-center gap-1 text-[11px]"
                        >
                          <Copy className="h-3 w-3" />
                          {copiedCodeId === c.id ? 'Copied' : 'Copy'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 4: RELAY FUEL POLICIES ── */}
      {activeSubTab === 'policies' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Corporate Fuel Policies ({policies.length} Active in Relay)
              </h3>
              <p className="text-xs text-slate-500">
                Configured rules defining merchant restrictions, driver prompts, and ELD cross-validation.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {policies.map((pol: any) => (
              <div key={pol.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex justify-between items-start border-b border-slate-100 pb-2.5">
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900">{pol.name}</h4>
                    <p className="text-[10px] text-slate-400 font-mono">ID: {pol.id}</p>
                  </div>
                  {pol.eld_enabled ? (
                    <span className="px-2 py-0.5 bg-blue-50 border border-blue-200 text-blue-700 text-[9px] font-bold rounded-full">
                      ELD ACTIVE
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[9px] font-bold rounded-full">
                      STANDARD
                    </span>
                  )}
                </div>

                <div className="space-y-2 text-xs">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    Required Authorization Prompts:
                  </p>
                  {pol.authorization_prompts && pol.authorization_prompts.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {pol.authorization_prompts.map((p: any, idx: number) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-mono text-slate-800 font-bold"
                        >
                          {p.name} ({p.validation_mode})
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic">No custom prompts required</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
