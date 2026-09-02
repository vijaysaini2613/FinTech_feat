import React from 'react';
import { Activity, Power } from 'lucide-react';

export interface BankTelemetryData {
  bank_code: string;
  bank_name: string;
  clearing_rate_pct: number;
  status: 'HEALTHY' | 'DEGRADED' | 'OUTAGE';
  active_circuit_breaker: boolean;
  last_updated: string;
}

interface BankHealthBarProps {
  telemetry: Record<string, BankTelemetryData>;
  onToggleOutage: (bankCode: string, isOutage: boolean) => void;
}

export const BankHealthBar: React.FC<BankHealthBarProps> = ({ telemetry, onToggleOutage }) => {
  const bankList = Object.values(telemetry);

  return (
    <div className="glass-panel bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl mb-6 shadow-sm dark:shadow-md">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base tracking-wide">Issuing Bank Uptime & Circuit Breaker Telemetry</h3>
        </div>
        <span className="text-xs text-slate-600 dark:text-slate-300 font-mono font-semibold">Live NPCI Clearing Metrics</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {bankList.map((bank) => {
          const isOutage = bank.active_circuit_breaker || bank.status === 'OUTAGE';
          return (
            <div
              key={bank.bank_code}
              className={`p-3.5 rounded-xl border transition-all ${
                isOutage
                  ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-400 dark:border-rose-600/50 shadow-sm dark:shadow-rose-950/30'
                  : bank.status === 'DEGRADED'
                  ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 dark:border-amber-500/40'
                  : 'bg-slate-50 dark:bg-slate-900/90 border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-xs text-slate-900 dark:text-white">{bank.bank_name}</span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold ${
                    isOutage
                      ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30'
                      : bank.status === 'DEGRADED'
                      ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  {isOutage ? 'CIRCUIT OPEN' : bank.status}
                </span>
              </div>

              <div className="flex items-baseline justify-between mb-1.5">
                <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">Clearing Rate:</span>
                <span className="font-mono text-sm font-extrabold text-slate-900 dark:text-white">
                  {bank.clearing_rate_pct.toFixed(1)}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 mb-3 overflow-hidden">
                <div
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    isOutage ? 'bg-rose-500' : bank.status === 'DEGRADED' ? 'bg-amber-400' : 'bg-emerald-400'
                  }`}
                  style={{ width: `${bank.clearing_rate_pct}%` }}
                />
              </div>

              {/* Interactive Outage Simulation Button */}
              <button
                onClick={() => onToggleOutage(bank.bank_code, !isOutage)}
                className={`w-full py-1 px-2 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition ${
                  isOutage
                    ? 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                    : 'bg-rose-600/10 hover:bg-rose-600/20 text-rose-700 dark:text-rose-300 border border-rose-500/30'
                }`}
              >
                <Power className="w-3 h-3" />
                <span>{isOutage ? 'Restore Telemetry' : 'Simulate Outage'}</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
