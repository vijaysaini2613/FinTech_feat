import React, { useState } from 'react';
import { Play, Sparkles, Terminal, Coins, ArrowUpRight } from 'lucide-react';

interface SimulationStudioProps {
  onTriggerSimulation: (params: {
    preset?: string;
    customAmount?: number;
    customErrorCode?: string;
    customErrorDesc?: string;
  }) => Promise<void>;
}

export const SimulationStudio: React.FC<SimulationStudioProps> = ({ onTriggerSimulation }) => {
  const [loading, setLoading] = useState(false);
  const [customAmount, setCustomAmount] = useState<number>(12500);
  const [customErrorCode, setCustomErrorCode] = useState<string>('GATEWAY_ERROR');
  const [customErrorDesc, setCustomErrorDesc] = useState<string>('HDFC0092: Customer debit limit reached under RBI e-mandate guidelines');

  const handlePreset = async (presetName: string) => {
    setLoading(true);
    try {
      await onTriggerSimulation({ preset: presetName });
    } finally {
      setLoading(false);
    }
  };

  const handleCustomTrigger = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onTriggerSimulation({
        customAmount,
        customErrorCode,
        customErrorDesc,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl mb-6 shadow-sm dark:shadow-md">
      <div className="flex items-center space-x-3 mb-4">
        <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
          <Terminal className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">Next-Gen Payment Gateway Simulation Studio</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400">Test Pay-by-Bank (UPI AutoPay), Programmable CBDC (e-Rupee), and Open Banking VRP rails live</p>
        </div>
      </div>

      {/* Preset Buttons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* Preset 1: Tier 1 */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-blue-500/30 dark:border-blue-500/20 hover:border-blue-500/50 transition flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-xs text-blue-600 dark:text-blue-400 uppercase tracking-wider">Tier 1 Simulation</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">
                Soft Failure
              </span>
            </div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-1">HDFC Gateway Timeout</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
              Simulates a 504 network timeout. Telemetry engine checks HDFC uptime and schedules off-peak background retry.
            </p>
          </div>
          <button
            disabled={loading}
            onClick={() => handlePreset('TIER_1_SOFT_FAIL')}
            className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold text-xs flex items-center justify-center space-x-1.5 transition shadow-md shadow-blue-600/20"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Simulate Tier 1 Telemetry Retry</span>
          </button>
        </div>

        {/* Preset 2: Tier 2 (Pay-by-Bank / UPI AutoPay) */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-purple-500/30 dark:border-purple-500/20 hover:border-purple-500/50 transition flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-xs text-purple-600 dark:text-purple-400 uppercase tracking-wider">Pay-by-Bank (A2A)</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20">
                UPI AutoPay
              </span>
            </div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-1">Expired Card e-Mandate</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
              Simulates expired card token. Engine provisions 1-tap UPI AutoPay migration link and dispatches WhatsApp nudge.
            </p>
          </div>
          <button
            disabled={loading}
            onClick={() => handlePreset('TIER_2_UPI_SWITCH')}
            className="w-full py-2 px-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-semibold text-xs flex items-center justify-center space-x-1.5 transition shadow-md shadow-purple-600/20"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Simulate Tier 2 Pay-by-Bank Switch</span>
          </button>
        </div>

        {/* Preset 3: Tier 3 (HITL Guardrail) */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-rose-500/30 dark:border-rose-500/20 hover:border-rose-500/50 transition flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-xs text-rose-600 dark:text-rose-400 uppercase tracking-wider">Tier 3 HITL Guardrail</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20">
                &ge; ₹25,000 High Risk
              </span>
            </div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-1">High-Value Enterprise Invoice</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
              Simulates ₹75,000 corporate payment failure. Engine freezes auto-retry and routes to Merchant HITL Queue.
            </p>
          </div>
          <button
            disabled={loading}
            onClick={() => handlePreset('TIER_3_HIGH_VALUE_HITL')}
            className="w-full py-2 px-3 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-semibold text-xs flex items-center justify-center space-x-1.5 transition shadow-md shadow-rose-600/20"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Simulate Tier 3 HITL Guardrail</span>
          </button>
        </div>
      </div>

      {/* Innovation Presets: CBDC & Open Banking VRP */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-emerald-500/30 dark:border-emerald-500/20 hover:border-emerald-500/50 transition flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-xs text-slate-900 dark:text-white">Programmable CBDC (e-Rupee) Rail</h4>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">Zero-fee instant cross-border settlement for international mandate drops</p>
            </div>
          </div>
          <button
            disabled={loading}
            onClick={() => handlePreset('CBDC_SETTLEMENT_RAIL')}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg flex items-center space-x-1 transition shrink-0"
          >
            <span>Trigger CBDC</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-amber-500/30 dark:border-amber-500/20 hover:border-amber-500/50 transition flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-xs text-slate-900 dark:text-white">Open Banking VRP Rail</h4>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">Variable Recurring Payments bypassing card network interchange fees</p>
            </div>
          </div>
          <button
            disabled={loading}
            onClick={() => handlePreset('OPEN_BANKING_VRP_RAIL')}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-lg flex items-center space-x-1 transition shrink-0"
          >
            <span>Trigger VRP</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Custom Webhook Event Generator */}
      <form onSubmit={handleCustomTrigger} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center space-x-1">
            <Sparkles className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>Evaluate Gemini 2.5 Flash AI Classifier with Custom Raw Error Text</span>
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Zero AI execution decisions safety boundary</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
          <div>
            <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1">Invoice Amount (₹):</label>
            <input
              type="number"
              value={customAmount}
              onChange={(e) => setCustomAmount(Number(e.target.value))}
              className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-slate-900 dark:text-slate-100 text-xs font-mono focus:border-cyan-500 focus:outline-none shadow-sm"
            />
          </div>

          <div>
            <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1">Raw Error Code:</label>
            <input
              type="text"
              value={customErrorCode}
              onChange={(e) => setCustomErrorCode(e.target.value)}
              className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-slate-900 dark:text-slate-100 text-xs font-mono focus:border-cyan-500 focus:outline-none shadow-sm"
            />
          </div>

          <div>
            <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1">Raw Bank Gateway Error String:</label>
            <input
              type="text"
              value={customErrorDesc}
              onChange={(e) => setCustomErrorDesc(e.target.value)}
              className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-slate-900 dark:text-slate-100 text-xs font-mono focus:border-cyan-500 focus:outline-none shadow-sm"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-lg transition shadow-md shadow-cyan-600/20"
        >
          {loading ? 'Processing Webhook Simulation...' : 'Fire Custom Webhook Payload & Evaluate Gemini AI Classifier'}
        </button>
      </form>
    </div>
  );
};
