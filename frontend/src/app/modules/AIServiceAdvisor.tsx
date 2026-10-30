'use client';
import React, { useState } from 'react';
import {
  AIAdvisorSettingsConfig,
  AIHealthInsight,
  Asset,
  User as DbUser,
  WorkOrder,
  getStore,
  setStore,
  getSingleStore,
  setSingleStore,
  initialAIAdvisorSettings,
  initialAIHealthInsights
} from '../mockDb';
import { apiCreateWorkOrder } from '../lib/api-client';
import {
  Sparkles,
  Activity,
  AlertTriangle,
  CheckCircle,
  Wrench,
  Cpu,
  Brain,
  Sliders,
  Send,
  ArrowRight,
  TrendingUp,
  ShieldCheck
} from 'lucide-react';

interface Props {
  assets: Asset[];
  currentUser: DbUser;
  onRefresh: () => void;
}

export default function AIServiceAdvisor({ assets, currentUser, onRefresh }: Props) {
  const [config, setConfig] = useState<AIAdvisorSettingsConfig>(() => getSingleStore('aiAdvisorSettings', initialAIAdvisorSettings));
  const [insights, setInsights] = useState<AIHealthInsight[]>(() => getStore('aiHealthInsights', initialAIHealthInsights));

  // AI Chat Assistant State
  const [chatPrompt, setChatPrompt] = useState('');
  const [chatLog, setChatLog] = useState<Array<{ sender: 'USER' | 'AI'; message: string; timestamp: string }>>([
    {
      sender: 'AI',
      message: 'Hello! I am your AI Service Advisor. I continuously analyze J1939 telematics streams, eDVIR failure patterns, and repair histories to forecast maintenance needs before roadside breakdowns happen.',
      timestamp: 'Just now'
    }
  ]);
  const [isThinking, setIsThinking] = useState(false);

  // Save Settings
  const handleSaveConfig = (newCfg: AIAdvisorSettingsConfig) => {
    setSingleStore('aiAdvisorSettings', newCfg);
    setConfig(newCfg);
    onRefresh();
  };

  // Convert AI Insight to Work Order
  const handleCreateWoFromInsight = async (insight: AIHealthInsight) => {
    const asset = assets.find(a => a.id === insight.assetId);
    try {
      await apiCreateWorkOrder({
        assetId: insight.assetId,
        priority: insight.severity === 'CRITICAL' || insight.severity === 'HIGH' ? 'HIGH' : 'MEDIUM',
        type: 'INTERNAL',
        description: `AI Advisory WO: ${insight.title} - ${insight.recommendation}`,
      });

      // Remove or mark insight
      const updatedInsights = insights.filter(i => i.id !== insight.id);
      setStore('aiHealthInsights', updatedInsights);
      setInsights(updatedInsights);

      alert(`Work Order generated successfully for ${asset?.name || 'Asset'}!`);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to create work order from AI insight');
    }
  };

  // Run AI Diagnostic Prompt
  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatPrompt.trim()) return;

    const userMsg = chatPrompt;
    setChatLog(prev => [...prev, { sender: 'USER', message: userMsg, timestamp: new Date().toLocaleTimeString() }]);
    setChatPrompt('');
    setIsThinking(true);

    setTimeout(() => {
      let aiResponse = "Analyzing historical sensor telemetry and DTC fault codes...";
      if (userMsg.toLowerCase().includes('coolant') || userMsg.toLowerCase().includes('hot') || userMsg.toLowerCase().includes('temp')) {
        aiResponse = "Based on SPN 110 FMI 15 telemetry on Tractor #102, engine coolant temperature reached 228°F under heavy grade load. Recommended diagnosis: Inspect thermostat housing and verify fan clutch engagement cycle.";
      } else if (userMsg.toLowerCase().includes('brake') || userMsg.toLowerCase().includes('stopping')) {
        aiResponse = "Brake stroke telemetry and eDVIR logs indicate 0.25 inch pushrod travel discrepancy on steer axle. Recommended action: Check slack adjuster automatic ratcheting mechanism and lining thickness.";
      } else if (userMsg.toLowerCase().includes('fuel') || userMsg.toLowerCase().includes('mpg')) {
        aiResponse = "Fuel economy analysis shows Tractor #102 dropped to 2.1 MPG in Nevada jurisdiction due to continuous engine idling. Recommended: Implement 5-minute auto-shutdown policy.";
      } else {
        aiResponse = `AI Diagnostic analysis for "${userMsg}": No critical hardware failure detected. All active powertrain parameters are within 94% OEM nominal tolerance.`;
      }

      setChatLog(prev => [...prev, { sender: 'AI', message: aiResponse, timestamp: new Date().toLocaleTimeString() }]);
      setIsThinking(false);
    }, 900);
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-violet-50 text-violet-700 text-xs font-bold border border-violet-200 mb-1">
            <Sparkles className="h-3.5 w-3.5 text-violet-600" />
            Intelligence Engine &bull; Version 2.4
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2.5">
            AI Service Advisor
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Machine-learning diagnostics, dual-trigger component failure forecasting, and automated repair estimate reviews.
          </p>
        </div>
      </div>

      {/* Main Grid: Insights Left / Config & Chat Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: ACTIVE PREDICTIVE INSIGHTS (2 COL SPAN) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Brain className="h-5 w-5 text-[#00BA7C]" />
              Active Predictive Anomaly Warnings
            </h2>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
              {insights.length} Active Forecasts
            </span>
          </div>

          {insights.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-2 shadow-sm">
              <ShieldCheck className="h-10 w-10 text-emerald-500 mx-auto" />
              <h3 className="font-bold text-sm text-slate-900">All Fleet Powertrains Healthy</h3>
              <p className="text-xs text-slate-500">No anomalous sensor drifts or pre-failure indicators detected.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {insights.map(item => {
                const asset = assets.find(a => a.id === item.assetId);
                return (
                  <div
                    key={item.id}
                    className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 transition hover:border-emerald-300"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            item.severity === 'CRITICAL' || item.severity === 'HIGH'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {item.severity} Risk
                          </span>
                          <span className="text-xs font-bold text-slate-900">{asset?.name}</span>
                          <span className="text-[11px] font-mono text-slate-400">&bull; {item.date}</span>
                        </div>
                        <h3 className="font-black text-base text-slate-900">{item.title}</h3>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-black text-[#00BA7C] bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                          {item.confidenceScore}% Confidence
                        </span>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                      <p className="text-slate-700">
                        <strong className="text-slate-900">Forecast:</strong> {item.prediction}
                      </p>
                      <p className="text-emerald-950 font-medium">
                        <strong className="text-emerald-950">AI Action:</strong> {item.recommendation}
                      </p>
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        onClick={() => handleCreateWoFromInsight(item)}
                        className="px-4 py-2 bg-[#00BA7C] hover:bg-[#00BA7C] text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5"
                      >
                        <Wrench className="h-3.5 w-3.5" /> Convert to Work Order
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* AI Diagnostic Terminal */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-violet-600" />
              AI Fleet Diagnostics Assistant
            </h2>

            <div className="h-48 overflow-y-auto space-y-2 p-3 bg-slate-950 rounded-xl font-mono text-xs text-slate-200">
              {chatLog.map((c, i) => (
                <div key={i} className={`p-2 rounded-lg ${c.sender === 'USER' ? 'bg-emerald-950/80 border border-emerald-800 text-right ml-12' : 'bg-slate-900 text-left mr-12'}`}>
                  <p className="text-[10px] text-slate-400 font-bold mb-0.5">{c.sender === 'USER' ? 'You' : 'AI Service Advisor'}</p>
                  <p className="text-slate-100">{c.message}</p>
                </div>
              ))}
              {isThinking && (
                <div className="text-xs text-emerald-400 animate-pulse font-mono">
                  Thinking & query-analyzing ECM fault telemetry...
                </div>
              )}
            </div>

            <form onSubmit={handleSendChat} className="flex gap-2">
              <input
                type="text"
                value={chatPrompt}
                onChange={e => setChatPrompt(e.target.value)}
                placeholder="Ask AI e.g. 'Why is Tractor #102 running hot under load?'"
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#00BA7C] font-medium"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1"
              >
                <Send className="h-3.5 w-3.5" /> Ask AI
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: AI CONFIGURATION & CONTROLS */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="h-4 w-4 text-[#00BA7C]" />
              Advisor Sensitivity Settings
            </h2>

            <div className="space-y-4 text-xs">
              {/* Toggle 1: Predictive Engine */}
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-bold text-slate-900">Predictive Modeling</p>
                  <p className="text-slate-500 text-[11px]">Continuously scan ECM streams</p>
                </div>
                <input
                  type="checkbox"
                  checked={config.predictiveEnabled}
                  onChange={e => handleSaveConfig({ ...config, predictiveEnabled: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-[#00BA7C] focus:ring-[#00BA7C]"
                />
              </div>

              {/* Sensitivity dropdown */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Anomaly Detection Sensitivity</label>
                <select
                  value={config.sensitivity}
                  onChange={e => handleSaveConfig({ ...config, sensitivity: e.target.value as any })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold text-slate-900"
                >
                  <option value="HIGH">High (Flags subtle 10% deviations)</option>
                  <option value="MEDIUM">Medium (Recommended default)</option>
                  <option value="LOW">Low (Flags only severe critical drifts)</option>
                </select>
              </div>

              {/* Toggle 2: Diagnostic Assistant */}
              <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                <div>
                  <p className="font-bold text-slate-900">Interactive Diagnostics</p>
                  <p className="text-slate-500 text-[11px]">Enable LLM repair advisor terminal</p>
                </div>
                <input
                  type="checkbox"
                  checked={config.diagnosticAssistant}
                  onChange={e => handleSaveConfig({ ...config, diagnosticAssistant: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-[#00BA7C] focus:ring-[#00BA7C]"
                />
              </div>

              {/* Toggle 3: Estimate Auditing */}
              <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                <div>
                  <p className="font-bold text-slate-900">Estimate Benchmark Auditing</p>
                  <p className="text-slate-500 text-[11px]">Auto-flag inflated shop quotes</p>
                </div>
                <input
                  type="checkbox"
                  checked={config.estimateAuditing}
                  onChange={e => handleSaveConfig({ ...config, estimateAuditing: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-[#00BA7C] focus:ring-[#00BA7C]"
                />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-950 to-slate-900 text-white rounded-2xl p-5 shadow-sm space-y-3">
            <h3 className="text-sm font-bold flex items-center gap-2 text-emerald-300">
              <Cpu className="h-4 w-4 text-emerald-400" />
              Machine Learning Telemetry Engine
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Trained on over 1.2M commercial heavy duty diesel engine hours, J1939 fault telemetry, and VMRS component service standard intervals.
            </p>
            <div className="pt-2 border-t border-emerald-800 text-[11px] text-emerald-300 flex justify-between">
              <span>Model: Titan-Fleet-v4</span>
              <span>Status: Online</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
