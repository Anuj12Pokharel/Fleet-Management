'use client';
import React from 'react';
import { ReplacementAnalysis, Asset } from '../mockDb';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Props {
  replacementAnalysis: ReplacementAnalysis[];
  assets: Asset[];
}

const recColors = {
  KEEP: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400', badge: 'bg-green-500/20 text-green-300' },
  MONITOR: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', badge: 'bg-amber-500/20 text-amber-300' },
  REPLACE: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', badge: 'bg-red-500/20 text-red-300' },
};

const recIcon = {
  KEEP: <TrendingUp className="h-5 w-5 text-green-400" />,
  MONITOR: <Minus className="h-5 w-5 text-amber-400" />,
  REPLACE: <TrendingDown className="h-5 w-5 text-red-400" />,
};

function ageYears(dateStr: string) {
  return ((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24 * 365.25)).toFixed(1);
}

export default function Replacement({ replacementAnalysis, assets }: Props) {
  return (
    <div className="space-y-6">
      {/* Summary Row */}
      <div className="grid grid-cols-3 gap-4">
        {(['KEEP', 'MONITOR', 'REPLACE'] as const).map(rec => {
          const count = replacementAnalysis.filter(r => r.recommendation === rec).length;
          const c = recColors[rec];
          return (
            <div key={rec} className={`${c.bg} border ${c.border} rounded-2xl p-4 text-center`}>
              <div className="flex justify-center mb-2">{recIcon[rec]}</div>
              <p className={`text-3xl font-black ${c.text}`}>{count}</p>
              <p className="text-xs text-slate-400 mt-1 font-semibold">{rec}</p>
            </div>
          );
        })}
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {replacementAnalysis.map(ra => {
          const asset = assets.find(a => a.id === ra.assetId);
          const c = recColors[ra.recommendation];
          const costRatio = ra.lifetimeCostToDate / ra.purchasePrice;
          const depreciation = ((ra.purchasePrice - ra.estimatedCurrentValue) / ra.purchasePrice) * 100;
          const years = ageYears(ra.purchaseDate);

          return (
            <div key={ra.id} className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-extrabold text-slate-900 text-base">{asset?.name || ra.assetId}</p>
                  <p className="text-[10px] text-slate-500 font-mono">{asset?.vin}</p>
                  <p className="text-xs text-slate-500 mt-0.5 font-medium">Purchased {ra.purchaseDate} · Age: {years} yrs · {asset?.odometer.toLocaleString()} mi</p>
                </div>
                <div className="flex items-center gap-2">
                  {recIcon[ra.recommendation]}
                  <span className={`text-xs font-bold px-3 py-1 rounded-full border ${c.badge}`}>
                    {ra.recommendation}
                  </span>
                </div>
              </div>

              {/* Cost metrics */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Purchase Price</p>
                  <p className="text-sm font-extrabold text-slate-900">${ra.purchasePrice.toLocaleString()}</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Spent</p>
                  <p className={`text-sm font-extrabold ${c.text}`}>${ra.lifetimeCostToDate.toLocaleString()}</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Est. Value</p>
                  <p className="text-sm font-extrabold text-slate-900">${ra.estimatedCurrentValue.toLocaleString()}</p>
                </div>
              </div>

              {/* Cost ratio bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-600 font-medium">
                  <span>Lifetime Cost vs Purchase Price</span>
                  <span className={c.text + ' font-extrabold'}>{(costRatio * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className={`h-2 rounded-full transition-all ${ra.recommendation === 'KEEP' ? 'bg-emerald-500' : ra.recommendation === 'MONITOR' ? 'bg-amber-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.min(costRatio * 100, 100)}%` }} />
                </div>
                <div className="flex justify-between text-xs text-slate-600 font-medium">
                  <span>Depreciation</span>
                  <span className="font-extrabold text-slate-900">{depreciation.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="h-2 rounded-full bg-violet-600 transition-all"
                    style={{ width: `${Math.min(depreciation, 100)}%` }} />
                </div>
              </div>

              {/* Recommendation rationale */}
              <div className="text-xs text-slate-700 font-medium bg-slate-50 border border-slate-200 rounded-xl p-3.5 leading-relaxed">
                {ra.recommendation === 'KEEP' && '✅ Lifetime costs are well below purchase price. Strong asset value remains. Continue scheduled maintenance.'}
                {ra.recommendation === 'MONITOR' && '⚠️ Lifetime costs approaching 70%+ of purchase. Begin tracking repair ROI carefully. Budget for potential replacement.'}
                {ra.recommendation === 'REPLACE' && '🔴 Lifetime costs exceed purchase price. Asset is a financial liability. Initiate procurement process for replacement.'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
