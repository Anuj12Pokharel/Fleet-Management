'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Award,
  AlertTriangle,
  FileText,
  Download,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  Percent,
  Truck,
  Car,
  FileCheck,
  Building,
  Printer
} from 'lucide-react';
import { DOTInspection, AccidentClaim, RenewalAlert, User as DbUser } from '../mockDb';

interface SafetyScorecardModuleProps {
  currentUser: DbUser;
  dotInspections: DOTInspection[];
  accidentClaims: AccidentClaim[];
  renewalAlerts: RenewalAlert[];
  onShowToast: (msg: string) => void;
}

export default function SafetyScorecardModule({
  currentUser,
  dotInspections = [],
  accidentClaims = [],
  renewalAlerts = [],
  onShowToast
}: SafetyScorecardModuleProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'24M' | '12M' | 'YTD'>('24M');

  // Calculate dynamic metrics
  const cleanInspections = dotInspections.filter(i => i.result === 'CLEAN').length;
  const violationInspections = dotInspections.filter(i => i.result === 'VIOLATION').length;
  const totalInspections = dotInspections.length || 1;
  const cleanInspectionRate = Math.round((cleanInspections / totalInspections) * 100);

  const totalClaims = accidentClaims.length;
  const totalClaimsCost = accidentClaims.reduce((acc, c) => acc + (c.actualRepairCost || 0), 0);
  const totalInsurancePayout = accidentClaims.reduce((acc, c) => acc + (c.insurancePayout || 0), 0);

  // Overall Fleet Safety Rating (0 - 100)
  // Base 100 minus points for violations and claims
  const safetyIndex = Math.max(75, Math.min(100, 100 - (violationInspections * 3) - (totalClaims * 4)));

  const handleExportInsurancePacket = () => {
    const reportText = `
========================================================================
             SUPERTRUCK FLEETCARE - UNDERWRITING RISK PACKET
========================================================================
Generated: ${new Date().toISOString()}
DOT Safety Fitness Rating: SATISFACTORY (Preferred Tier 1)
Overall Fleet Safety Index: ${safetyIndex} / 100

1. FMCSA BASICs SAFETY METRICS:
   - Unsafe Driving Measure: 8% (FMCSA Intervention Threshold: 65%) -> STATUS: EXCELLENT
   - Crash Indicator: ${totalClaims > 0 ? '12%' : '0%'} (Threshold: 65%) -> STATUS: PREFERRED
   - HOS Compliance: 10% (Threshold: 65%) -> STATUS: LOW RISK
   - Vehicle Maintenance: ${100 - cleanInspectionRate}% (Threshold: 80%) -> STATUS: LOW RISK
   - Driver Fitness: 4% (Threshold: 80%) -> STATUS: PREFERRED

2. DOT ROADSIDE INSPECTIONS (LAST 24 MONTHS):
   - Total Formal Inspections: ${totalInspections}
   - Clean Inspections Passed: ${cleanInspections} (${cleanInspectionRate}%)
   - Violations Recorded: ${violationInspections}
   - Out-of-Service (OOS) Rate: 0.0% (National Fleet Average: 21.4%)

3. LOSS-RUN & CLAIMS SUMMARY:
   - Total Incurred Losses: $${totalClaimsCost.toLocaleString()}
   - Insurance Claim Recoveries: $${totalInsurancePayout.toLocaleString()}
   - Net Out-of-Pocket: $${(totalClaimsCost - totalInsurancePayout).toLocaleString()}
   - Loss Frequency: ${(totalClaims / 4).toFixed(2)} claims / power unit / year

4. REGULATORY STATUS:
   - IRP & IFTA Tax Standing: COMPLIANT / ACTIVE
   - MCS-150 Biennial Update: CURRENT
========================================================================
`;

    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Insurance_Underwriting_Risk_Packet_${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    onShowToast('Commercial Insurance Underwriting Risk Packet downloaded!');
  };

  return (
    <div className="space-y-6">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
              <Award className="h-5 w-5 text-[#00BA7C]" />
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Fleet Safety & Insurance Risk Scorecard
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            FMCSA Safety Measurement System (SMS), BASICs percentiles, loss-run loss ratio, and insurance underwriting profile.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportInsurancePacket}
            className="px-4 py-2 bg-[#00BA7C] hover:bg-[#00A86B] text-xs font-bold text-white rounded-xl flex items-center gap-1.5 shadow-sm transition"
          >
            <Download className="h-4 w-4" />
            Export Underwriter Packet
          </button>
        </div>
      </div>

      {/* ── TOP KPI BANNER ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Overall Safety Rating */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col items-center justify-center shrink-0">
            <span className="text-lg font-black text-[#00BA7C]">{safetyIndex}</span>
            <span className="text-[9px] font-bold text-emerald-700">/ 100</span>
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Safety Health Index
            </span>
            <h4 className="text-sm font-extrabold text-slate-900 mt-0.5">Tier 1 Preferred</h4>
            <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
              <CheckCircle2 className="h-3 w-3" /> FMCSA Satisfactory
            </p>
          </div>
        </div>

        {/* DOT Clean Inspection Pass Rate */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-blue-50 border border-blue-200 flex flex-col items-center justify-center shrink-0">
            <span className="text-lg font-black text-blue-600">{cleanInspectionRate}%</span>
            <span className="text-[9px] font-bold text-blue-700">Pass</span>
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Clean Inspections
            </span>
            <h4 className="text-sm font-extrabold text-slate-900 mt-0.5">{cleanInspections} of {totalInspections} Clean</h4>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">
              0.0% Out-of-Service (OOS)
            </p>
          </div>
        </div>

        {/* Insurance Claims Loss Ratio */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-purple-50 border border-purple-200 flex flex-col items-center justify-center shrink-0">
            <span className="text-lg font-black text-purple-700">{totalClaims}</span>
            <span className="text-[9px] font-bold text-purple-600">Claims</span>
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Loss-Run Frequency
            </span>
            <h4 className="text-sm font-extrabold text-slate-900 mt-0.5">
              ${totalClaimsCost.toLocaleString()} Incurred
            </h4>
            <p className="text-[10px] text-purple-600 font-semibold mt-0.5">
              ${totalInsurancePayout.toLocaleString()} recovered
            </p>
          </div>
        </div>

        {/* Premium Discount Tier */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col items-center justify-center shrink-0">
            <span className="text-lg font-black text-amber-700">-18%</span>
            <span className="text-[9px] font-bold text-amber-600">Credit</span>
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Underwriter Discount
            </span>
            <h4 className="text-sm font-extrabold text-slate-900 mt-0.5">Preferred Fleet</h4>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">
              Zero open safety tags
            </p>
          </div>
        </div>
      </div>

      {/* ── FMCSA BASICS PERCENTILES MATRIX ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">
              FMCSA BASICs Safety Measurement Thresholds
            </h3>
            <p className="text-xs text-slate-500">
              Lower percentile equals safer operation. Scores below the intervention threshold prevent DOT warning letters.
            </p>
          </div>
          <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-lg">
            All Categories In Compliance
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
          {/* 1. Unsafe Driving */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="font-extrabold text-slate-900">Unsafe Driving</span>
              <span className="font-black text-[#00BA7C]">8%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
              <div className="bg-[#00BA7C] h-full rounded-full" style={{ width: '8%' }} />
            </div>
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>Threshold: 65%</span>
              <span className="text-emerald-700 font-bold">LOW RISK</span>
            </div>
          </div>

          {/* 2. Crash Indicator */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="font-extrabold text-slate-900">Crash Indicator</span>
              <span className="font-black text-emerald-600">{totalClaims > 0 ? '12%' : '0%'}</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
              <div className="bg-emerald-600 h-full rounded-full" style={{ width: totalClaims > 0 ? '12%' : '2%' }} />
            </div>
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>Threshold: 65%</span>
              <span className="text-emerald-700 font-bold">PREFERRED</span>
            </div>
          </div>

          {/* 3. HOS Compliance */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="font-extrabold text-slate-900">HOS Compliance</span>
              <span className="font-black text-blue-600">10%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
              <div className="bg-blue-600 h-full rounded-full" style={{ width: '10%' }} />
            </div>
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>Threshold: 65%</span>
              <span className="text-blue-700 font-bold">CLEAN ELD</span>
            </div>
          </div>

          {/* 4. Vehicle Maintenance */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="font-extrabold text-slate-900">Vehicle Maint.</span>
              <span className="font-black text-indigo-600">{100 - cleanInspectionRate}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
              <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${Math.max(5, 100 - cleanInspectionRate)}%` }} />
            </div>
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>Threshold: 80%</span>
              <span className="text-indigo-700 font-bold">PREVENTIVE</span>
            </div>
          </div>

          {/* 5. Driver Fitness */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="font-extrabold text-slate-900">Driver Fitness</span>
              <span className="font-black text-emerald-600">4%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
              <div className="bg-emerald-600 h-full rounded-full" style={{ width: '4%' }} />
            </div>
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>Threshold: 80%</span>
              <span className="text-emerald-700 font-bold">CDL VERIFIED</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── COMMERCIAL INSURANCE POLICY MATRIX ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <h3 className="text-sm font-extrabold text-slate-900">
          Commercial Insurance Policy & Registration Health
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Policy 1: Auto Liability */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-900">Commercial Auto Liability</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                ACTIVE
              </span>
            </div>
            <p className="text-[11px] text-slate-600 font-mono">Underwriter: Travelers Commercial ($1,000,000 CSL)</p>
            <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-200 flex justify-between">
              <span>Policy #: TRV-COMM-99201</span>
              <span>Expires: In 185 days</span>
            </div>
          </div>

          {/* Policy 2: Physical Damage & Cargo */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-900">Motor Truck Cargo & Physical Damage</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                ACTIVE
              </span>
            </div>
            <p className="text-[11px] text-slate-600 font-mono">Underwriter: Great American ($250,000 Cargo / $1k Ded)</p>
            <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-200 flex justify-between">
              <span>Policy #: GAC-TRK-77140</span>
              <span>Expires: In 240 days</span>
            </div>
          </div>

          {/* Policy 3: General Liability */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-900">Commercial General Liability</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                ACTIVE
              </span>
            </div>
            <p className="text-[11px] text-slate-600 font-mono">Underwriter: Progressive Commercial ($2,000,000 Agg)</p>
            <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-200 flex justify-between">
              <span>Policy #: PGR-GL-552018</span>
              <span>Expires: In 310 days</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
