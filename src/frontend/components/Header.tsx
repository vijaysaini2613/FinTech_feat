import React from 'react';
import { ShieldCheck, Settings, Sun, Moon } from 'lucide-react';

interface HeaderProps {
  serverStatus: 'ONLINE' | 'OFFLINE';
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onOpenPolicy: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  serverStatus,
  theme,
  onToggleTheme,
  onOpenPolicy,
  activeTab,
  setActiveTab,
}) => {
  const tabs = [
    { id: 'overview', label: 'Command Center' },
    { id: 'hitl', label: 'HITL Review Queue' },
    { id: 'fsm', label: 'FSM Live Pipeline' },
    { id: 'simulator', label: 'Simulation Studio' },
    { id: 'ledger', label: 'Audit Ledger' },
    { id: 'bank', label: 'Bank Telemetry' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 shadow-sm dark:shadow-slate-950/60 transition-colors duration-200">
      <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3 sm:gap-6">
          {/* Logo & Branding */}
          <div className="flex items-center space-x-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col justify-center">
              <div className="flex items-center space-x-2 whitespace-nowrap">
                <span className="font-bold text-base sm:text-lg tracking-tight text-slate-900 dark:text-white whitespace-nowrap">MandateHeal Engine</span>
                <span className="px-2.5 py-0.5 text-[11px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 rounded-full whitespace-nowrap hidden sm:inline-block">
                  Track 03: Revenue Recovery
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap hidden xl:block">Autonomous e-Mandate & UPI AutoPay Churn Healing System</p>
            </div>
          </div>

          {/* Centered Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-100 dark:bg-slate-900/90 p-1 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-inner overflow-x-auto no-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap shrink-0 leading-normal ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Right Action Bar */}
          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
            {/* Theme Toggle Button */}
            <button
              onClick={onToggleTheme}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-700/80 text-xs font-medium transition shadow-sm flex items-center justify-center"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-600" />
              )}
            </button>

            {/* Server Status Pill */}
            <div className="flex items-center space-x-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full text-xs shadow-inner whitespace-nowrap">
              <span className={`w-2 h-2 rounded-full shrink-0 ${serverStatus === 'ONLINE' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
              <span className="text-slate-700 dark:text-slate-300 font-mono font-medium text-[11px] sm:text-xs">{serverStatus}</span>
            </div>

            {/* Merchant Policy Modal Trigger */}
            <button
              onClick={onOpenPolicy}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-700/80 text-xs font-medium transition shadow-sm whitespace-nowrap"
            >
              <Settings className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
              <span className="hidden sm:inline">Merchant Policy</span>
            </button>
          </div>
        </div>

        {/* Mobile Tab Bar */}
        <div className="md:hidden flex overflow-x-auto py-2 space-x-1 border-t border-slate-200 dark:border-slate-800/60 no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap shrink-0 transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold'
                  : 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800'
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
