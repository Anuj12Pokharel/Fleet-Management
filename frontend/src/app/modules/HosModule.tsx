'use client';

import React, { useState, useEffect } from 'react';
import {
  Clock,
  Timer,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Download,
  Calendar,
  Truck,
  User,
  Coffee,
  Bed,
  Car,
  ClipboardCheck,
  RefreshCw
} from 'lucide-react';
import { Asset, User as DbUser } from '../mockDb';
import {
  apiGetHosLogs,
  apiGetHosClocks,
  apiSetHosStatus,
  apiCertifyHosLogs,
  ApiHosLog
} from '../lib/api-client';

interface HosLogEntry {
  id: string;
  driverId: string;
  driverName: string;
  status: 'OFF_DUTY' | 'SLEEPER_BERTH' | 'DRIVING' | 'ON_DUTY';
  startTime: string;
  endTime?: string;
  durationMinutes: number;
  location: string;
  odometer: number;
  vehicleName: string;
  certified: boolean;
}

interface HosModuleProps {
  currentUser: DbUser;
  assets: Asset[];
  onShowToast: (msg: string) => void;
}

export default function HosModule({ currentUser, assets, onShowToast }: HosModuleProps) {
  // Current Driver Duty Status
  const [currentStatus, setCurrentStatus] = useState<'OFF_DUTY' | 'SLEEPER_BERTH' | 'DRIVING' | 'ON_DUTY'>('OFF_DUTY');
  const [selectedAsset, setSelectedAsset] = useState<Asset>(assets[0] || null);

  // Regulatory Clocks (Minutes remaining)
  const [driveTimeMinutes, setDriveTimeMinutes] = useState(660); // 11h default
  const [shiftTimeMinutes, setShiftTimeMinutes] = useState(840); // 14h default
  const [breakTimeMinutes, setBreakTimeMinutes] = useState(480); // 8h default
  const [cycleTimeMinutes, setCycleTimeMinutes] = useState(4200); // 70h default

  // Daily Certified
  const [isCertified, setIsCertified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Initial Log Entries - pure empty state from backend
  const [logs, setLogs] = useState<HosLogEntry[]>([]);

  const fetchHosData = async () => {
    setIsLoading(true);
    try {
      const [rawLogs, clocks] = await Promise.all([
        apiGetHosLogs().catch(() => []),
        apiGetHosClocks().catch(() => null)
      ]);

      if (clocks) {
        if (clocks.currentStatus) {
          setCurrentStatus(clocks.currentStatus);
        }
        if (typeof clocks.driveMinutesLeft === 'number') setDriveTimeMinutes(clocks.driveMinutesLeft);
        if (typeof clocks.shiftMinutesLeft === 'number') setShiftTimeMinutes(clocks.shiftMinutesLeft);
        if (typeof clocks.breakMinutesLeft === 'number') setBreakTimeMinutes(clocks.breakMinutesLeft);
        if (typeof clocks.cycleMinutesLeft === 'number') setCycleTimeMinutes(clocks.cycleMinutesLeft);
      }

      if (Array.isArray(rawLogs)) {
        const mapped: HosLogEntry[] = rawLogs.map((r: ApiHosLog) => {
          const start = new Date(r.startedAt);
          const end = r.endedAt ? new Date(r.endedAt) : null;
          const dur = end
            ? Math.round((end.getTime() - start.getTime()) / (60 * 1000))
            : Math.round((Date.now() - start.getTime()) / (60 * 1000));
          const v = assets.find(a => a.id === r.assetId);

          return {
            id: r.id,
            driverId: r.driverId,
            driverName: currentUser.name,
            status: r.status,
            startTime: isNaN(start.getTime()) ? '—' : start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            endTime: end ? (isNaN(end.getTime()) ? '—' : end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })) : 'Current',
            durationMinutes: Math.max(1, dur),
            location: r.location || 'Terminal',
            odometer: r.odometer || 0,
            vehicleName: v?.name || 'Tractor',
            certified: !!r.certified
          };
        });
        setLogs(mapped);
        setIsCertified(mapped.length > 0 && mapped.every(l => l.certified));
      }
    } catch (err) {
      console.error('Failed to load HOS records:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHosData();
  }, [currentUser.id]);

  // Format minutes into HH:MM
  const formatTime = (totalMinutes: number) => {
    const hours = Math.floor(Math.max(0, totalMinutes) / 60);
    const mins = Math.max(0, totalMinutes) % 60;
    return `${hours}h ${mins.toString().padStart(2, '0')}m`;
  };

  const handleStatusChange = async (newStatus: 'OFF_DUTY' | 'SLEEPER_BERTH' | 'DRIVING' | 'ON_DUTY') => {
    if (newStatus === currentStatus) return;

    try {
      const odo = selectedAsset ? Math.round(selectedAsset.odometer) : 0;
      const locationName = newStatus === 'DRIVING' ? 'En Route (GPS)' : 'Terminal Yard';

      await apiSetHosStatus({
        status: newStatus,
        location: locationName,
        odometer: odo,
        assetId: selectedAsset?.id
      });

      setCurrentStatus(newStatus);
      onShowToast(`Duty Status switched to ${newStatus.replace('_', ' ')}! ELD record updated.`);
      await fetchHosData();
    } catch (err: any) {
      onShowToast(err.message || 'Failed to update duty status');
    }
  };

  const handleCertifyLogs = async () => {
    try {
      await apiCertifyHosLogs();
      setIsCertified(true);
      setLogs(prev => prev.map(l => ({ ...l, certified: true })));
      onShowToast('FMCSA § 395.30 Daily Electronic Driver Log certified successfully!');
    } catch (err: any) {
      onShowToast(err.message || 'Failed to certify daily log');
    }
  };

  const handleExportHosCsv = () => {
    const headers = ['Duty Status,Start Time,End Time,Duration (Mins),Location,Odometer,Vehicle,Driver,FMCSA Certified'];
    const rows = logs.map(l =>
      `"${l.status}","${l.startTime}","${l.endTime || ''}","${l.durationMinutes}","${l.location}","${l.odometer}","${l.vehicleName}","${l.driverName}","${l.certified ? 'YES' : 'NO'}"`
    );
    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `HOS_ELD_Logs_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    onShowToast('FMCSA ELD HOS Log exported to CSV.');
  };

  return (
    <div className="space-y-6">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
              <Clock className="h-5 w-5 text-[#00BA7C]" />
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Hours of Service (HOS) & ELD Mandate
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            FMCSA 49 CFR Part 395 compliant live duty clocks, electronic logging device (ELD) records, and rest break tracking.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportHosCsv}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 rounded-xl flex items-center gap-1.5 shadow-xs transition"
          >
            <Download className="h-4 w-4 text-slate-500" />
            Export ELD Records
          </button>
          <button
            onClick={handleCertifyLogs}
            disabled={isCertified}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition ${
              isCertified
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'bg-[#00BA7C] hover:bg-[#00A86B] text-white'
            }`}
          >
            <ClipboardCheck className="h-4 w-4" />
            {isCertified ? 'Daily Log Certified' : 'Certify Daily Log (§ 395.30)'}
          </button>
        </div>
      </div>

      {/* ── REGULATORY CLOCKS CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 11-Hour Driving Limit */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs relative overflow-hidden">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              11-Hr Drive Limit
            </span>
            <Timer className="h-4 w-4 text-[#00BA7C]" />
          </div>
          <div className="text-2xl font-black text-slate-900">{formatTime(driveTimeMinutes)}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Remaining Drive Time</div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
            <div
              className="bg-[#00BA7C] h-full rounded-full transition-all duration-500"
              style={{ width: `${(driveTimeMinutes / (11 * 60)) * 100}%` }}
            />
          </div>
        </div>

        {/* 14-Hour Shift Window */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs relative overflow-hidden">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              14-Hr Shift Window
            </span>
            <Clock className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{formatTime(shiftTimeMinutes)}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Remaining Shift Window</div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
            <div
              className="bg-emerald-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${(shiftTimeMinutes / (14 * 60)) * 100}%` }}
            />
          </div>
        </div>

        {/* 8-Hour Rest Break */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs relative overflow-hidden">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Break Required In
            </span>
            <Coffee className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">{formatTime(breakTimeMinutes)}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Until 30-Min Rest Break</div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
            <div
              className="bg-amber-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${(breakTimeMinutes / (8 * 60)) * 100}%` }}
            />
          </div>
        </div>

        {/* 70-Hour / 8-Day Cycle */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs relative overflow-hidden">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              70-Hr / 8-Day Cycle
            </span>
            <Calendar className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{formatTime(cycleTimeMinutes)}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Remaining Cycle Time</div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
            <div
              className="bg-blue-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${(cycleTimeMinutes / (70 * 60)) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── DRIVER DUTY STATUS SWITCHER ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <User className="h-4 w-4 text-[#00BA7C]" />
              Driver Duty Status Control ({currentUser.name})
            </h3>
            <p className="text-xs text-slate-500">
              Select duty status to record instant ELD change. Changes are timestamped per 49 CFR § 395.24.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-semibold">Assigned Unit:</span>
            <select
              value={selectedAsset?.id || ''}
              onChange={e => {
                const a = assets.find(x => x.id === e.target.value);
                if (a) setSelectedAsset(a);
              }}
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 font-bold text-slate-800 text-xs"
            >
              {assets.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 4 Large Duty Status Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
          {/* OFF DUTY */}
          <button
            onClick={() => handleStatusChange('OFF_DUTY')}
            className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition ${
              currentStatus === 'OFF_DUTY'
                ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-slate-900/20'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Bed className="h-5 w-5" />
            <span className="text-xs font-extrabold">OFF DUTY</span>
            <span className={`text-[10px] ${currentStatus === 'OFF_DUTY' ? 'text-slate-300' : 'text-slate-400'}`}>
              Personal conveyance
            </span>
          </button>

          {/* SLEEPER BERTH */}
          <button
            onClick={() => handleStatusChange('SLEEPER_BERTH')}
            className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition ${
              currentStatus === 'SLEEPER_BERTH'
                ? 'bg-indigo-700 text-white border-indigo-700 shadow-md ring-2 ring-indigo-500/20'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Bed className="h-5 w-5" />
            <span className="text-xs font-extrabold">SLEEPER BERTH</span>
            <span className={`text-[10px] ${currentStatus === 'SLEEPER_BERTH' ? 'text-indigo-200' : 'text-slate-400'}`}>
              Rest in cab berth
            </span>
          </button>

          {/* DRIVING */}
          <button
            onClick={() => handleStatusChange('DRIVING')}
            className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition ${
              currentStatus === 'DRIVING'
                ? 'bg-[#00BA7C] text-white border-[#00BA7C] shadow-md ring-2 ring-[#00BA7C]/30'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Car className="h-5 w-5" />
            <span className="text-xs font-extrabold">DRIVING</span>
            <span className={`text-[10px] ${currentStatus === 'DRIVING' ? 'text-emerald-100' : 'text-slate-400'}`}>
              Vehicle in motion
            </span>
          </button>

          {/* ON DUTY */}
          <button
            onClick={() => handleStatusChange('ON_DUTY')}
            className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition ${
              currentStatus === 'ON_DUTY'
                ? 'bg-amber-600 text-white border-amber-600 shadow-md ring-2 ring-amber-500/20'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Coffee className="h-5 w-5" />
            <span className="text-xs font-extrabold">ON DUTY</span>
            <span className={`text-[10px] ${currentStatus === 'ON_DUTY' ? 'text-amber-100' : 'text-slate-400'}`}>
              Loading, fuel, pre-trip
            </span>
          </button>
        </div>
      </div>

      {/* ── 24-HOUR ELD LOG TIMELINE ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">
              Electronic Driver Record of Duty Status (RODS)
            </h3>
            <p className="text-xs text-slate-500">
              FMCSA standard 24-hour interval duty transitions for today
            </p>
          </div>
          <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">
            Date: {new Date().toLocaleDateString()}
          </span>
        </div>

        {/* Visual Bar Graph */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex justify-between">
            <span>00:00 (Midnight)</span>
            <span>06:00 AM</span>
            <span>12:00 PM (Noon)</span>
            <span>06:00 PM</span>
            <span>24:00 (End of Day)</span>
          </div>

          <div className="h-7 w-full bg-slate-200 rounded-lg overflow-hidden flex">
            {logs.length === 0 ? (
              <div className="w-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400">
                NO DUTY LOGS RECORDED FOR TODAY
              </div>
            ) : (
              logs.slice(0, 8).map((seg) => {
                const totalMins = logs.reduce((acc, l) => acc + l.durationMinutes, 0) || 1;
                const pct = Math.max(8, Math.min(60, Math.round((seg.durationMinutes / totalMins) * 100)));
                const bg =
                  seg.status === 'DRIVING'
                    ? 'bg-[#00BA7C]'
                    : seg.status === 'ON_DUTY'
                    ? 'bg-amber-600'
                    : seg.status === 'SLEEPER_BERTH'
                    ? 'bg-indigo-700'
                    : 'bg-slate-900';
                return (
                  <div
                    key={seg.id}
                    style={{ width: `${pct}%` }}
                    className={`${bg} flex items-center justify-center text-[9px] font-bold text-white truncate px-1 border-r border-white/20`}
                  >
                    {seg.status.replace('_', ' ')} ({Math.round((seg.durationMinutes / 60) * 10) / 10}h)
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Log Entries Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Time Range</th>
                <th className="py-2.5 px-3">Duration</th>
                <th className="py-2.5 px-3">Location</th>
                <th className="py-2.5 px-3">Odometer</th>
                <th className="py-2.5 px-3">Vehicle</th>
                <th className="py-2.5 px-3 text-right">Certification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-1">
                      <Clock className="h-6 w-6 text-slate-300" />
                      <span className="font-semibold text-slate-500">No duty status logs recorded</span>
                      <span className="text-[11px] text-slate-400">Switch duty status above to generate compliant FMCSA ELD records.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition">
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                        log.status === 'DRIVING' ? 'bg-emerald-100 text-emerald-800' :
                        log.status === 'ON_DUTY' ? 'bg-amber-100 text-amber-800' :
                        log.status === 'SLEEPER_BERTH' ? 'bg-indigo-100 text-indigo-800' :
                        'bg-slate-100 text-slate-800'
                      }`}>
                        {log.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                      {log.startTime} &rarr; {log.endTime || 'Current'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 font-semibold">
                      {log.durationMinutes} mins
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">{log.location}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">
                      {log.odometer.toLocaleString()} mi
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 font-medium">
                      {log.vehicleName}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {log.certified ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" /> § 395.30 Signed
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400">Pending Sign</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
