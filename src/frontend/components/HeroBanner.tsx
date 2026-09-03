import React from 'react';
import { Zap, ShieldCheck, ArrowRight, Play, Cpu, Smartphone, CheckCircle } from 'lucide-react';

interface HeroBannerProps {
  onGoToSimulator: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ onGoToSimulator }) => {
  return (
    <div className="glass-panel bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-purple-900/40 dark:from-blue-950/60 dark:via-indigo-950/40 dark:to-purple-950/60 border border-blue-500/30 p-6 rounded-3xl mb-6 relative overflow-hidden shadow-lg">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
        
        {/* Left Pitch Intro */}
        <div className="max-w-2xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 text-xs font-bold mb-3">
            <Zap className="w-3.5 h-3.5" />
            <span>Razorpay Track 03: Autonomous Revenue Recovery</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight mb-2">
            Automated e-Mandate & UPI AutoPay Churn Healing Engine
          </h2>

          <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
            When Indian recurring card debits fail due to RBI caps or bank outages, our engine captures the webhook, classifies the failure with <strong className="text-blue-600 dark:text-blue-400 font-bold">Google Gemini 2.5 Flash AI</strong>, and recovers revenue via off-peak retries or 1-tap UPI AutoPay links.
          </p>

          {/* Quick Demo CTA */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              onClick={onGoToSimulator}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition shadow-md shadow-blue-600/30 flex items-center space-x-2"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Launch Interactive Simulation Studio</span>
            </button>

            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              &bull; 100% Zero-Human Autonomous Yield
            </span>
          </div>
        </div>

        {/* Right 3-Step Visual Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full lg:w-auto shrink-0">
          {/* Step 1 */}
          <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center justify-center mx-auto mb-2 font-bold text-xs">
              1
            </div>
            <h4 className="font-bold text-xs text-slate-900 dark:text-white">Failure Webhook</h4>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 leading-snug">
              Card bounce / RBI cap detected
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 flex items-center justify-center mx-auto mb-2 font-bold text-xs">
              2
            </div>
            <h4 className="font-bold text-xs text-slate-900 dark:text-white">AI Classification</h4>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 leading-snug">
              Gemini AI provisions UPI link
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto mb-2 font-bold text-xs">
              3
            </div>
            <h4 className="font-bold text-xs text-slate-900 dark:text-white">Revenue Healed</h4>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 leading-snug">
              SHA-256 audit ledger recorded
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
