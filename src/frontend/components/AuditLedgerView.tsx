import React, { useState } from 'react';
import { Database, ShieldCheck, Search, ArrowRight } from 'lucide-react';

interface AuditLedgerViewProps {
  ledger: any[];
}

export const AuditLedgerView: React.FC<AuditLedgerViewProps> = ({ ledger }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = ledger.filter((entry) => {
    const term = searchTerm.toLowerCase();
    return (
      entry.action_type.toLowerCase().includes(term) ||
      entry.actor.toLowerCase().includes(term) ||
      entry.new_state.toLowerCase().includes(term) ||
      (entry.hash && entry.hash.toLowerCase().includes(term))
    );
  });

  const getActorBadge = (actor: string) => {
    switch (actor) {
      case 'SYSTEM_DAEMON':
        return <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">SYSTEM DAEMON</span>;
      case 'LLM_CLASSIFIER':
        return <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">LLM PARSER</span>;
      case 'MERCHANT_ADMIN':
        return <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">MERCHANT ADMIN</span>;
      case 'CUSTOMER':
        return <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">CUSTOMER</span>;
      default:
        return <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-slate-800 text-slate-200 border border-slate-700">{actor}</span>;
    }
  };

  return (
    <div className="glass-panel bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl mb-6 shadow-sm dark:shadow-md">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Immutable Cryptographic Audit Ledger</h3>
              <span className="px-2.5 py-0.5 text-xs font-extrabold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 rounded-full flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Append-Only SHA-256 Hashed</span>
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">Guarantees zero double-debiting with immutable state mutation records</p>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search action, actor, hash..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:border-emerald-500 w-64 shadow-sm"
          />
        </div>
      </div>

      {/* Ledger Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-mono font-bold border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="py-3 px-4">Recorded At</th>
              <th className="py-3 px-4">Actor</th>
              <th className="py-3 px-4">Action Type</th>
              <th className="py-3 px-4">FSM Transition</th>
              <th className="py-3 px-4">Cryptographic Hash</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80 font-mono">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-600 dark:text-slate-300 font-sans font-medium">
                  No audit log entries recorded yet.
                </td>
              </tr>
            ) : (
              filtered.map((entry) => (
                <tr key={entry.entry_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                  <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-semibold whitespace-nowrap">
                    {new Date(entry.recorded_at).toLocaleTimeString()}
                  </td>
                  <td className="py-3 px-4">{getActorBadge(entry.actor)}</td>
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">{entry.action_type}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-1.5 text-xs">
                      <span className="text-slate-600 dark:text-slate-300 font-semibold">{entry.previous_state || 'NONE'}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-emerald-700 dark:text-emerald-300 font-bold">{entry.new_state}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-cyan-700 dark:text-cyan-300 font-bold text-[11px]">
                    {entry.hash || 'hash_00000000'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
