'use client';
import React, { useState } from 'react';
import { TireReading, BrakeReading, Asset, User as DbUser } from '../mockDb';
import { apiCreateTireReading, apiCreateBrakeReading } from '../lib/api-client';
import { Plus, AlertTriangle, Layers, Disc, CheckCircle2, Gauge, Thermometer, ShieldCheck } from 'lucide-react';

interface Props {
  tireReadings: TireReading[];
  brakeReadings?: BrakeReading[];
  assets: Asset[];
  currentUser: DbUser;
  onRefresh: () => void;
}

const AXLE_POSITIONS: Array<'STEER_LEFT' | 'STEER_RIGHT' | 'DRIVE1_LEFT' | 'DRIVE1_RIGHT' | 'DRIVE2_LEFT' | 'DRIVE2_RIGHT' | 'TRAILER_LEFT' | 'TRAILER_RIGHT'> = [
  'STEER_LEFT', 'STEER_RIGHT',
  'DRIVE1_LEFT', 'DRIVE1_RIGHT',
  'DRIVE2_LEFT', 'DRIVE2_RIGHT',
  'TRAILER_LEFT', 'TRAILER_RIGHT'
];

// ── Tire helpers ─────────────────────────────────────────────────────────────
const psiStatus = (psi: number) => psi < 85 ? 'CRITICAL' : psi < 95 ? 'LOW' : 'OK';
const treadStatus = (t: number) => t < 3 ? 'CRITICAL' : t < 5 ? 'LOW' : 'OK';

// ── Brake helpers (FMCSA 49 CFR § 393.47 / § 396.3 standards) ────────────────
// Steering axle minimum: 8/32" (1/4"); Non-steering axle minimum: 4/32" (1/8")
const brakeLiningStatus = (thickness: number, isSteer: boolean) => {
  const minLegal = isSteer ? 8 : 4;
  if (thickness < minLegal) return 'CRITICAL';
  if (thickness <= minLegal + 2) return 'LOW';
  return 'OK';
};

// Pushrod chamber stroke: Type 30 standard max legal is 2.0 inches
const brakeStrokeStatus = (stroke: number) => {
  if (stroke > 2.0) return 'CRITICAL';
  if (stroke >= 1.75) return 'LOW';
  return 'OK';
};

const drumConditionStatus = (condition: string) => {
  if (condition === 'CRACKED') return 'CRITICAL';
  if (condition === 'SCORED' || condition === 'HEAT_CHECKED') return 'LOW';
  return 'OK';
};

const statusColors: Record<string, string> = {
  OK: 'text-green-600 bg-green-500/10 border-green-200',
  LOW: 'text-amber-600 bg-amber-500/10 border-amber-200',
  CRITICAL: 'text-red-600 bg-red-500/10 border-red-200',
};

export default function Tires({ tireReadings = [], brakeReadings = [], assets = [], currentUser, onRefresh }: Props) {
  const [activeSubTab, setActiveSubTab] = useState<'tires' | 'brakes'>('tires');
  const [selectedAsset, setSelectedAsset] = useState(assets[0]?.id || '');

  // Form states
  const [showTireForm, setShowTireForm] = useState(false);
  const [tireForm, setTireForm] = useState<{
    axlePosition: (typeof AXLE_POSITIONS)[number];
    tireBrand: string;
    psi: number;
    treadDepth: number;
  }>({ axlePosition: 'STEER_LEFT', tireBrand: '', psi: 110, treadDepth: 10 });

  const [showBrakeForm, setShowBrakeForm] = useState(false);
  const [brakeForm, setBrakeForm] = useState<{
    axlePosition: (typeof AXLE_POSITIONS)[number];
    brakeType: 'DRUM' | 'DISC';
    liningThickness: number;
    pushrodStroke: number;
    drumCondition: 'GOOD' | 'HEAT_CHECKED' | 'SCORED' | 'CRACKED';
    brakeTemp: number;
  }>({
    axlePosition: 'STEER_LEFT',
    brakeType: 'DISC',
    liningThickness: 12,
    pushrodStroke: 1.4,
    drumCondition: 'GOOD',
    brakeTemp: 145,
  });

  const canRecord = ['MECHANIC', 'MAINTENANCE_ADMIN', 'FLEET_MANAGER'].includes(currentUser.role);

  // Filter latest readings by position for selected vehicle
  const latestTires = AXLE_POSITIONS.reduce((acc, pos) => {
    const reading = (tireReadings || [])
      .filter(r => r.assetId === selectedAsset && r.axlePosition === pos)
      .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime())[0];
    if (reading) acc[pos] = reading;
    return acc;
  }, {} as Record<string, TireReading>);

  const latestBrakes = AXLE_POSITIONS.reduce((acc, pos) => {
    const reading = (brakeReadings || [])
      .filter(r => r.assetId === selectedAsset && r.axlePosition === pos)
      .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime())[0];
    if (reading) acc[pos] = reading;
    return acc;
  }, {} as Record<string, BrakeReading>);

  // Check overall brake status for DOT out-of-service alerts
  const criticalBrakesCount = Object.values(latestBrakes).filter(b => {
    const isSteer = b.axlePosition.startsWith('STEER');
    return brakeLiningStatus(b.liningThickness, isSteer) === 'CRITICAL' ||
      brakeStrokeStatus(b.pushrodStroke) === 'CRITICAL' ||
      drumConditionStatus(b.drumCondition) === 'CRITICAL';
  }).length;

  const handleTireSubmit = async () => {
    if (!tireForm.tireBrand) { alert('Tire brand is required.'); return; }
    try {
      await apiCreateTireReading({
        assetId: selectedAsset,
        axlePosition: tireForm.axlePosition,
        tireBrand: tireForm.tireBrand,
        psi: tireForm.psi,
        treadDepth: tireForm.treadDepth,
        recordedBy: currentUser.name
      });
      setShowTireForm(false);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to save tire reading.');
    }
  };

  const handleBrakeSubmit = async () => {
    try {
      await apiCreateBrakeReading({
        assetId: selectedAsset,
        axlePosition: brakeForm.axlePosition,
        brakeType: brakeForm.brakeType,
        liningThickness: brakeForm.liningThickness,
        pushrodStroke: brakeForm.pushrodStroke,
        drumCondition: brakeForm.drumCondition,
        brakeTemp: brakeForm.brakeTemp,
        recordedBy: currentUser.name
      });
      setShowBrakeForm(false);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to save brake reading.');
    }
  };

  // ── Tire Card Sub-component ──
  const TireCard = ({ pos }: { pos: (typeof AXLE_POSITIONS)[number] }) => {
    const r = latestTires[pos];
    if (!r) return (
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
        <p className="text-[10px] text-slate-500 font-bold font-mono">{pos.replace(/_/g, ' ')}</p>
        <p className="text-[10px] text-slate-400 mt-1 font-medium">No tire data</p>
      </div>
    );

    const ps = psiStatus(r.psi);
    const ts = treadStatus(r.treadDepth);
    const worst = (ps === 'CRITICAL' || ts === 'CRITICAL') ? 'CRITICAL' : (ps === 'LOW' || ts === 'LOW') ? 'LOW' : 'OK';

    return (
      <div className={`bg-slate-50 border rounded-xl p-3 space-y-2 ${worst === 'CRITICAL' ? 'border-red-300 bg-red-50/30' : worst === 'LOW' ? 'border-amber-300 bg-amber-50/30' : 'border-slate-200'}`}>
        <div className="flex items-center justify-between">
          <p className="text-[10px] text-slate-700 font-mono font-bold">{pos.replace(/_/g, ' ')}</p>
          {worst !== 'OK' && <AlertTriangle className="h-3 w-3 text-red-600" />}
        </div>
        <p className="text-[10px] text-slate-500 font-semibold truncate">{r.tireBrand}</p>
        <div className="space-y-1">
          <div className="flex justify-between text-[10px]">
            <span className="text-slate-500 font-medium">PSI</span>
            <span className="font-bold text-slate-900">{r.psi}</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-1.5">
            <div className={`h-1.5 rounded-full transition-all ${ps === 'OK' ? 'bg-emerald-500' : ps === 'LOW' ? 'bg-amber-500' : 'bg-red-500'}`}
              style={{ width: `${Math.min((r.psi / 120) * 100, 100)}%` }} />
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-[10px]">
            <span className="text-slate-500 font-medium">Tread</span>
            <span className={treadStatus(r.treadDepth) === 'OK' ? 'text-green-700 font-bold' : treadStatus(r.treadDepth) === 'LOW' ? 'text-amber-700 font-bold' : 'text-red-600 font-bold'}>{r.treadDepth}/32"</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-1.5">
            <div className={`h-1.5 rounded-full transition-all ${treadStatus(r.treadDepth) === 'OK' ? 'bg-emerald-500' : treadStatus(r.treadDepth) === 'LOW' ? 'bg-amber-500' : 'bg-red-500'}`}
              style={{ width: `${Math.min((r.treadDepth / 16) * 100, 100)}%` }} />
          </div>
        </div>
      </div>
    );
  };

  // ── Brake Card Sub-component ──
  const BrakeCard = ({ pos }: { pos: (typeof AXLE_POSITIONS)[number] }) => {
    const b = latestBrakes[pos];
    if (!b) return (
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
        <p className="text-[10px] text-slate-500 font-bold font-mono">{pos.replace(/_/g, ' ')}</p>
        <p className="text-[10px] text-slate-400 mt-1 font-medium">No brake data</p>
      </div>
    );

    const isSteer = pos.startsWith('STEER');
    const ls = brakeLiningStatus(b.liningThickness, isSteer);
    const ss = brakeStrokeStatus(b.pushrodStroke);
    const ds = drumConditionStatus(b.drumCondition);

    const isWorstCritical = ls === 'CRITICAL' || ss === 'CRITICAL' || ds === 'CRITICAL';
    const isWorstLow = ls === 'LOW' || ss === 'LOW' || ds === 'LOW';
    const worst = isWorstCritical ? 'CRITICAL' : isWorstLow ? 'LOW' : 'OK';

    return (
      <div className={`bg-slate-50 border rounded-xl p-3 space-y-2.5 transition ${isWorstCritical ? 'border-red-300 bg-red-50/30' : isWorstLow ? 'border-amber-300 bg-amber-50/30' : 'border-slate-200'}`}>
        <div className="flex items-center justify-between">
          <p className="text-[10px] text-slate-800 font-mono font-bold">{pos.replace(/_/g, ' ')}</p>
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
              {b.brakeType}
            </span>
            {isWorstCritical && (
              <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-red-600 text-white animate-pulse">
                OOS
              </span>
            )}
          </div>
        </div>

        {/* Lining / Pad Thickness */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px]">
            <span className="text-slate-500 font-medium">Lining Thickness</span>
            <span className={`font-bold ${ls === 'OK' ? 'text-green-700' : ls === 'LOW' ? 'text-amber-700' : 'text-red-600'}`}>
              {b.liningThickness}/32" ({((b.liningThickness * 25.4) / 32).toFixed(1)} mm)
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-1.5">
            <div className={`h-1.5 rounded-full transition-all ${ls === 'OK' ? 'bg-emerald-500' : ls === 'LOW' ? 'bg-amber-500' : 'bg-red-500'}`}
              style={{ width: `${Math.min((b.liningThickness / 16) * 100, 100)}%` }} />
          </div>
          <p className="text-[8.5px] text-slate-400">Legal Min: {isSteer ? '8/32" (Steer)' : '4/32" (Drive/Trailer)'}</p>
        </div>

        {/* Pushrod Stroke Travel */}
        <div className="space-y-1 pt-1 border-t border-slate-200/60">
          <div className="flex justify-between text-[10px]">
            <span className="text-slate-500 font-medium">Chamber Stroke</span>
            <span className={`font-mono font-bold ${ss === 'OK' ? 'text-slate-800' : ss === 'LOW' ? 'text-amber-700' : 'text-red-600'}`}>
              {b.pushrodStroke}" {ss === 'CRITICAL' ? '(Over 2.0" OOS)' : ''}
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-1.5">
            <div className={`h-1.5 rounded-full transition-all ${ss === 'OK' ? 'bg-emerald-500' : ss === 'LOW' ? 'bg-amber-500' : 'bg-red-500'}`}
              style={{ width: `${Math.min((b.pushrodStroke / 2.5) * 100, 100)}%` }} />
          </div>
        </div>

        {/* Drum Condition & Temp */}
        <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-200/60 font-mono">
          <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-bold ${b.drumCondition === 'GOOD' ? 'bg-emerald-100 text-emerald-800' : b.drumCondition === 'CRACKED' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>
            {b.drumCondition.replace('_', ' ')}
          </span>
          {b.brakeTemp && (
            <span className="text-slate-500 flex items-center gap-0.5">
              <Thermometer className="h-3 w-3 text-slate-400" />
              {b.brakeTemp}°F
            </span>
          )}
        </div>
      </div>
    );
  };

  const selectedVehicleName = assets.find(a => a.id === selectedAsset)?.name || 'Selected Vehicle';

  return (
    <div className="space-y-6">

      {/* Top Header & Sub-Tabs Navigation */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        
        {/* Tab Switcher Pills */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveSubTab('tires')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${activeSubTab === 'tires' ? 'bg-[#00BA7C] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <Layers className="h-4 w-4" />
            Tire Readings
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${activeSubTab === 'tires' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
              {(tireReadings || []).filter(r => r.assetId === selectedAsset).length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('brakes')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${activeSubTab === 'brakes' ? 'bg-[#00BA7C] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <Disc className="h-4 w-4" />
            Brake Readings
            {criticalBrakesCount > 0 ? (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full font-black bg-red-500 text-white animate-pulse">
                {criticalBrakesCount} Alert
              </span>
            ) : (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${activeSubTab === 'brakes' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                {(brakeReadings || []).filter(r => r.assetId === selectedAsset).length}
              </span>
            )}
          </button>
        </div>

        {/* Vehicle Selector & Action Button */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <select
            value={selectedAsset}
            onChange={e => setSelectedAsset(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:border-[#00BA7C] shadow-2xs"
          >
            {assets.map(a => <option key={a.id} value={a.id}>{a.name} ({a.type})</option>)}
          </select>

          {canRecord && (
            activeSubTab === 'tires' ? (
              <button
                onClick={() => setShowTireForm(!showTireForm)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-[#00BA7C] hover:bg-[#00A86B] rounded-xl text-xs font-bold text-white transition shadow-sm whitespace-nowrap"
              >
                <Plus className="h-3.5 w-3.5" /> Record Tire Reading
              </button>
            ) : (
              <button
                onClick={() => setShowBrakeForm(!showBrakeForm)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-[#00BA7C] hover:bg-[#00A86B] rounded-xl text-xs font-bold text-white transition shadow-sm whitespace-nowrap"
              >
                <Plus className="h-3.5 w-3.5" /> Record Brake Reading
              </button>
            )
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 1: TIRE READINGS                                                  */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeSubTab === 'tires' && (
        <div className="space-y-6">

          {/* New Tire Reading Form */}
          {showTireForm && (
            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 space-y-4 animate-in fade-in duration-150">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Layers className="h-4 w-4 text-[#00BA7C]" /> New Tire Reading Log — {selectedVehicleName}
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Axle Position</label>
                  <select
                    value={tireForm.axlePosition}
                    onChange={e => setTireForm(f => ({ ...f, axlePosition: e.target.value as any }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#00BA7C] font-medium"
                  >
                    {AXLE_POSITIONS.map(p => <option key={p} value={p}>{p.replace(/_/g, ' ')}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Tire Brand</label>
                  <input
                    type="text"
                    value={tireForm.tireBrand}
                    onChange={e => setTireForm(f => ({ ...f, tireBrand: e.target.value }))}
                    placeholder="e.g. Michelin X Multi"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#00BA7C] font-medium"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">PSI Pressure (Target: 105-115)</label>
                  <input
                    type="number"
                    value={tireForm.psi}
                    onChange={e => setTireForm(f => ({ ...f, psi: +e.target.value }))}
                    min={0} max={150}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#00BA7C] font-medium"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Tread Depth (32nds)</label>
                  <input
                    type="number"
                    value={tireForm.treadDepth}
                    onChange={e => setTireForm(f => ({ ...f, treadDepth: +e.target.value }))}
                    min={0} max={32}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#00BA7C] font-medium"
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
                <button
                  onClick={() => setShowTireForm(false)}
                  className="px-3.5 py-1.5 bg-slate-100 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleTireSubmit}
                  className="px-4 py-1.5 bg-[#00BA7C] hover:bg-[#00A86B] rounded-xl text-xs font-bold text-white shadow-sm"
                >
                  Save Tire Reading
                </button>
              </div>
            </div>
          )}

          {/* Axle Diagram */}
          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Per-Axle Tire Telematics Diagram</h4>
                <p className="text-xs text-slate-500">{selectedVehicleName}</p>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">FMCSA Legal Min: 4/32" Steer, 2/32" Drive</span>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">Steer Axle</p>
                <div className="grid grid-cols-2 gap-3">
                  <TireCard pos="STEER_LEFT" />
                  <TireCard pos="STEER_RIGHT" />
                </div>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">Drive Axle 1</p>
                <div className="grid grid-cols-2 gap-3">
                  <TireCard pos="DRIVE1_LEFT" />
                  <TireCard pos="DRIVE1_RIGHT" />
                </div>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">Drive Axle 2</p>
                <div className="grid grid-cols-2 gap-3">
                  <TireCard pos="DRIVE2_LEFT" />
                  <TireCard pos="DRIVE2_RIGHT" />
                </div>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">Trailer Axle</p>
                <div className="grid grid-cols-2 gap-3">
                  <TireCard pos="TRAILER_LEFT" />
                  <TireCard pos="TRAILER_RIGHT" />
                </div>
              </div>
            </div>
          </div>

          {/* Tire Readings History Table */}
          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5">
            <h4 className="text-sm font-bold text-slate-900 mb-3">Tire Inspection History</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-[10px] text-slate-500 font-bold uppercase border-b border-slate-200 text-left">
                    <th className="py-2.5 pr-4">Position</th>
                    <th className="py-2.5 pr-4">Brand</th>
                    <th className="py-2.5 pr-4 text-right">PSI</th>
                    <th className="py-2.5 pr-4 text-right">Tread Depth</th>
                    <th className="py-2.5 pr-4">Recorded By</th>
                    <th className="py-2.5">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(tireReadings || []).filter(r => r.assetId === selectedAsset).length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-400">No tire readings recorded for this vehicle yet.</td>
                    </tr>
                  ) : (
                    (tireReadings || []).filter(r => r.assetId === selectedAsset).map(r => {
                      const ps = psiStatus(r.psi);
                      const ts = treadStatus(r.treadDepth);
                      return (
                        <tr key={r.id} className="text-slate-700 hover:bg-slate-50">
                          <td className="py-2.5 pr-4 font-mono text-[10px] font-bold">{r.axlePosition.replace(/_/g, ' ')}</td>
                          <td className="py-2.5 pr-4 font-medium">{r.tireBrand}</td>
                          <td className={`py-2.5 pr-4 text-right font-bold ${ps === 'OK' ? 'text-green-700' : ps === 'LOW' ? 'text-amber-700' : 'text-red-600'}`}>{r.psi} PSI</td>
                          <td className={`py-2.5 pr-4 text-right font-bold ${ts === 'OK' ? 'text-green-700' : ts === 'LOW' ? 'text-amber-700' : 'text-red-600'}`}>{r.treadDepth}/32"</td>
                          <td className="py-2.5 pr-4 text-slate-500">{r.recordedBy}</td>
                          <td className="py-2.5 text-slate-500">{new Date(r.recordedAt).toLocaleDateString()}</td>
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

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 2: BRAKE READINGS (FMCSA § 393.47 Compliance)                     */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeSubTab === 'brakes' && (
        <div className="space-y-6">

          {/* DOT Out-of-Service Alert Banner */}
          {criticalBrakesCount > 0 ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between gap-3 text-red-900">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🚨</span>
                <div>
                  <h4 className="font-extrabold text-sm">FMCSA § 393.47 Out-of-Service Warning</h4>
                  <p className="text-xs text-red-700 mt-0.5">
                    {criticalBrakesCount} brake position(s) have failed thickness (&lt;8/32" steer or &lt;4/32" drive) or pushrod stroke limits (&gt;2.0"). Vehicle must be serviced before dispatch.
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-red-600 text-white font-black text-[10px] rounded-lg tracking-wider uppercase whitespace-nowrap">
                LOCKOUT REQUIRED
              </span>
            </div>
          ) : (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-900 text-xs font-semibold">
              <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0" />
              <span>All active brake measurements meet FMCSA 49 CFR § 393.47 and CVSA Out-of-Service Criteria.</span>
            </div>
          )}

          {/* New Brake Reading Form */}
          {showBrakeForm && (
            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 space-y-4 animate-in fade-in duration-150">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Disc className="h-4 w-4 text-[#00BA7C]" /> New Air Brake Inspection Entry — {selectedVehicleName}
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Axle Position</label>
                  <select
                    value={brakeForm.axlePosition}
                    onChange={e => setBrakeForm(f => ({ ...f, axlePosition: e.target.value as any }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#00BA7C] font-medium"
                  >
                    {AXLE_POSITIONS.map(p => <option key={p} value={p}>{p.replace(/_/g, ' ')}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Brake Mechanism Type</label>
                  <select
                    value={brakeForm.brakeType}
                    onChange={e => setBrakeForm(f => ({ ...f, brakeType: e.target.value as any }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#00BA7C] font-medium"
                  >
                    <option value="DRUM">S-Cam Drum Brake</option>
                    <option value="DISC">Air Disc Brake</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Lining/Pad Thickness (32nds)</label>
                  <input
                    type="number"
                    value={brakeForm.liningThickness}
                    onChange={e => setBrakeForm(f => ({ ...f, liningThickness: +e.target.value }))}
                    min={0} max={32}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#00BA7C] font-medium"
                  />
                  <p className="text-[9px] text-slate-400 mt-1">Min: 8/32" Steer | 4/32" Drive</p>
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Pushrod Chamber Stroke (Inches)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={brakeForm.pushrodStroke}
                    onChange={e => setBrakeForm(f => ({ ...f, pushrodStroke: +e.target.value }))}
                    min={0.5} max={3.0}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#00BA7C] font-medium"
                  />
                  <p className="text-[9px] text-slate-400 mt-1">Max legal: 2.0" (Type 30 standard)</p>
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Drum / Rotor Condition</label>
                  <select
                    value={brakeForm.drumCondition}
                    onChange={e => setBrakeForm(f => ({ ...f, drumCondition: e.target.value as any }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#00BA7C] font-medium"
                  >
                    <option value="GOOD">Good / Smooth Surface</option>
                    <option value="HEAT_CHECKED">Heat Checked (Superficial)</option>
                    <option value="SCORED">Scored (Grooves Present)</option>
                    <option value="CRACKED">Cracked (Out of Service)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Operating Temperature (°F)</label>
                  <input
                    type="number"
                    value={brakeForm.brakeTemp}
                    onChange={e => setBrakeForm(f => ({ ...f, brakeTemp: +e.target.value }))}
                    placeholder="e.g. 150"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#00BA7C] font-medium"
                  />
                  <p className="text-[9px] text-slate-400 mt-1">Normal: 120-200°F | Dragging: &gt;350°F</p>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
                <button
                  onClick={() => setShowBrakeForm(false)}
                  className="px-3.5 py-1.5 bg-slate-100 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBrakeSubmit}
                  className="px-4 py-1.5 bg-[#00BA7C] hover:bg-[#00A86B] rounded-xl text-xs font-bold text-white shadow-sm"
                >
                  Save Brake Reading
                </button>
              </div>
            </div>
          )}

          {/* Axle Brake Diagram */}
          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Commercial Air Brake Axle Matrix</h4>
                <p className="text-xs text-slate-500">{selectedVehicleName}</p>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">CVSA North American Standard</span>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">Steer Axle (Steering Brakes)</p>
                <div className="grid grid-cols-2 gap-3">
                  <BrakeCard pos="STEER_LEFT" />
                  <BrakeCard pos="STEER_RIGHT" />
                </div>
              </div>

              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">Drive Axle 1</p>
                <div className="grid grid-cols-2 gap-3">
                  <BrakeCard pos="DRIVE1_LEFT" />
                  <BrakeCard pos="DRIVE1_RIGHT" />
                </div>
              </div>

              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">Drive Axle 2</p>
                <div className="grid grid-cols-2 gap-3">
                  <BrakeCard pos="DRIVE2_LEFT" />
                  <BrakeCard pos="DRIVE2_RIGHT" />
                </div>
              </div>

              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">Trailer Axle</p>
                <div className="grid grid-cols-2 gap-3">
                  <BrakeCard pos="TRAILER_LEFT" />
                  <BrakeCard pos="TRAILER_RIGHT" />
                </div>
              </div>
            </div>
          </div>

          {/* Brake History Table */}
          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5">
            <h4 className="text-sm font-bold text-slate-900 mb-3">Brake Inspection History & Measurements</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-[10px] text-slate-500 font-bold uppercase border-b border-slate-200 text-left">
                    <th className="py-2.5 pr-4">Position</th>
                    <th className="py-2.5 pr-4">Type</th>
                    <th className="py-2.5 pr-4 text-right">Lining Thickness</th>
                    <th className="py-2.5 pr-4 text-right">Chamber Stroke</th>
                    <th className="py-2.5 pr-4">Drum / Rotor</th>
                    <th className="py-2.5 pr-4 text-right">Temp</th>
                    <th className="py-2.5 pr-4">Inspector</th>
                    <th className="py-2.5">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(brakeReadings || []).filter(b => b.assetId === selectedAsset).length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-6 text-center text-slate-400">No brake readings recorded for this vehicle yet.</td>
                    </tr>
                  ) : (
                    (brakeReadings || []).filter(b => b.assetId === selectedAsset).map(b => {
                      const isSteer = b.axlePosition.startsWith('STEER');
                      const ls = brakeLiningStatus(b.liningThickness, isSteer);
                      const ss = brakeStrokeStatus(b.pushrodStroke);
                      return (
                        <tr key={b.id} className="text-slate-700 hover:bg-slate-50">
                          <td className="py-2.5 pr-4 font-mono text-[10px] font-bold">{b.axlePosition.replace(/_/g, ' ')}</td>
                          <td className="py-2.5 pr-4 font-medium">{b.brakeType}</td>
                          <td className={`py-2.5 pr-4 text-right font-bold ${ls === 'OK' ? 'text-green-700' : ls === 'LOW' ? 'text-amber-700' : 'text-red-600'}`}>
                            {b.liningThickness}/32"
                          </td>
                          <td className={`py-2.5 pr-4 text-right font-mono font-bold ${ss === 'OK' ? 'text-slate-800' : ss === 'LOW' ? 'text-amber-700' : 'text-red-600'}`}>
                            {b.pushrodStroke}"
                          </td>
                          <td className="py-2.5 pr-4">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${b.drumCondition === 'GOOD' ? 'bg-emerald-100 text-emerald-800' : b.drumCondition === 'CRACKED' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>
                              {b.drumCondition.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="py-2.5 pr-4 text-right text-slate-500 font-mono">
                            {b.brakeTemp ? `${b.brakeTemp}°F` : '—'}
                          </td>
                          <td className="py-2.5 pr-4 text-slate-500">{b.recordedBy}</td>
                          <td className="py-2.5 text-slate-500">{new Date(b.recordedAt).toLocaleDateString()}</td>
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

    </div>
  );
}
