import React from 'react';
import { ShieldCheck, Activity, Settings, Zap, Database } from 'lucide-react';

interface HeaderProps {
  serverStatus: 'ONLINE' | 'OFFLINE';
  onOpenPolicy: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ serverStatus, onOpenPolicy, activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'overview', label: 'Command Center' },
    { id: 'hitl', label: 'HITL Review Queue' },
    { id: 'fsm', label: 'FSM Live Pipeline' },
    { id: 'simulator', label: 'Simulation Studio' },
    { id: 'ledger', label: 'Audit Ledger' },
    { id: 'bank', label: 'Bank Telemetry' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Branding */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight text-white">MandateHeal Engine</span>
                <span className="px-2 py-0.5 text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full">
                  Track 03: Revenue Recovery
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Autonomous e-Mandate & UPI AutoPay Churn Healing System</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Right Action Bar */}
          <div className="flex items-center space-x-3">
            {/* Server Status Pill */}
            <div className="flex items-center space-x-2 px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-xs">
              <span className={`w-2 h-2 rounded-full ${serverStatus === 'ONLINE' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
              <span className="text-slate-300 font-mono font-medium">{serverStatus}</span>
            </div>

            {/* Merchant Policy Modal Trigger */}
            <button
              onClick={onOpenPolicy}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 text-xs font-medium transition"
            >
              <Settings className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Merchant Policy</span>
            </button>
          </div>
        </div>

        {/* Mobile Tab Bar */}
        <div className="md:hidden flex overflow-x-auto py-2 space-x-1 border-t border-slate-800/50 no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1 text-xs font-medium rounded-lg whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 bg-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
