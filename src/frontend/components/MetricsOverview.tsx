import React from 'react';
import { IndianRupee, TrendingUp, ShieldCheck, Zap, Clock, Users } from 'lucide-react';

interface MetricsProps {
  stats: {
    totalRecoveredARR: number;
    totalFailedVolume: number;
    recoveryRatePct: number;
    autonomousYieldPct: number;
    churnPreventedCount: number;
    mttrHours: number;
    totalFailureEvents: number;
    resolvedCount: number;
    hitlCount: number;
    upiMigratedCount: number;
    scheduledRetryCount: number;
  };
}

export const MetricsOverview: React.FC<MetricsProps> = ({ stats }) => {
  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Metric 1: Recovery Rate (%) */}
      <div className="glass-panel bg-white/90 dark:bg-slate-900/90 p-5 rounded-2xl relative overflow-hidden group border border-blue-500/30 dark:border-blue-500/40 shadow-sm dark:shadow-blue-500/10">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-25 transition">
          <IndianRupee className="w-16 h-16 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">
            <TrendingUp className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Recovery Rate (%)</span>
        </div>
        <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight mb-1">
          {stats.recoveryRatePct}% <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">({formatINR(stats.totalRecoveredARR)})</span>
        </div>
        <div className="flex items-center text-xs text-emerald-700 dark:text-emerald-300 font-semibold">
          <span>Formula: (INR Recovered / INR Ingested) &times; 100</span>
        </div>
      </div>

      {/* Metric 2: Autonomous Yield (%) */}
      <div className="glass-panel bg-white/90 dark:bg-slate-900/90 p-5 rounded-2xl relative overflow-hidden group border border-cyan-500/30 dark:border-cyan-500/40 shadow-sm dark:shadow-cyan-500/10">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-25 transition">
          <Zap className="w-16 h-16 text-cyan-600 dark:text-cyan-400" />
        </div>
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">
            <Zap className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Autonomous Yield</span>
        </div>
        <div className="text-2xl font-extrabold text-cyan-600 dark:text-cyan-300 font-mono tracking-tight mb-1">
          {stats.autonomousYieldPct}% <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">Zero-Human</span>
        </div>
        <div className="text-xs text-slate-700 dark:text-slate-300 font-medium">
          Tier 1 & Tier 2 autonomous recoveries ratio
        </div>
      </div>

      {/* Metric 3: Involuntary Churn Prevented */}
      <div className="glass-panel bg-white/90 dark:bg-slate-900/90 p-5 rounded-2xl relative overflow-hidden group border border-emerald-500/30 dark:border-emerald-500/40 shadow-sm dark:shadow-emerald-500/10">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-25 transition">
          <Users className="w-16 h-16 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Involuntary Churn Saved</span>
        </div>
        <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-300 font-mono tracking-tight mb-1">
          {stats.churnPreventedCount} <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">Subscriptions Saved</span>
        </div>
        <div className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">
          Saved from RBI e-mandate & token drop-offs
        </div>
      </div>

      {/* Metric 4: Mean Time to Resolution (MTTR) */}
      <div className="glass-panel bg-white/90 dark:bg-slate-900/90 p-5 rounded-2xl relative overflow-hidden group border border-purple-500/30 dark:border-purple-500/40 shadow-sm dark:shadow-purple-500/10">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-25 transition">
          <Clock className="w-16 h-16 text-purple-600 dark:text-purple-400" />
        </div>
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30">
            <Clock className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">MTTR (Resolution Speed)</span>
        </div>
        <div className="text-2xl font-extrabold text-purple-600 dark:text-purple-300 font-mono tracking-tight mb-1">
          {stats.mttrHours} hrs <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">Avg MTTR</span>
        </div>
        <div className="text-xs text-slate-700 dark:text-slate-300 font-medium">
          Time from webhook ingestion to RESOLVED state
        </div>
      </div>
    </div>
  );
};
