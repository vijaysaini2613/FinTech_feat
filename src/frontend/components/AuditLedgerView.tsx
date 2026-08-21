import React, { useState } from 'react';
import { Database, ShieldCheck, Key, Search, ArrowRight, User, Cpu, ShieldAlert } from 'lucide-react';

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
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">SYSTEM DAEMON</span>;
      case 'LLM_CLASSIFIER':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">LLM PARSER</span>;
      case 'MERCHANT_ADMIN':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">MERCHANT ADMIN</span>;
      case 'CUSTOMER':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">CUSTOMER</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">{actor}</span>;
    }
  };

  return (
    <div className="glass-panel p-6 rounded-2xl mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-slate-100 text-base">Immutable Cryptographic Audit Ledger</h3>
              <span className="px-2 py-0.5 text-[10px] font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center space-x-1">
                <ShieldCheck className="w-3 h-3" />
                <span>Append-Only SHA-256 Hashed</span>
              </span>
            </div>
            <p className="text-xs text-slate-400">Guarantees zero double-debiting with immutable state mutation records</p>
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
            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:border-emerald-500 w-64"
          />
        </div>
      </div>

      {/* Ledger Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900/90 text-slate-400 font-mono border-b border-slate-800">
            <tr>
              <th className="py-3 px-4">Recorded At</th>
              <th className="py-3 px-4">Actor</th>
              <th className="py-3 px-4">Action Type</th>
              <th className="py-3 px-4">FSM Transition</th>
              <th className="py-3 px-4">Cryptographic Hash</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-500 font-sans">
                  No audit log entries recorded yet.
                </td>
              </tr>
            ) : (
              filtered.map((entry) => (
                <tr key={entry.entry_id} className="hover:bg-slate-900/40 transition">
                  <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                    {new Date(entry.recorded_at).toLocaleTimeString()}
                  </td>
                  <td className="py-3 px-4">{getActorBadge(entry.actor)}</td>
                  <td className="py-3 px-4 font-bold text-slate-200">{entry.action_type}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-1.5 text-[11px]">
                      <span className="text-slate-400">{entry.previous_state || 'NONE'}</span>
                      <ArrowRight className="w-3 h-3 text-slate-500" />
                      <span className="text-emerald-400 font-bold">{entry.new_state}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-400 truncate max-w-[200px]" title={entry.hash}>
                    <div className="flex items-center space-x-1">
                      <Key className="w-3 h-3 text-slate-500" />
                      <span className="text-cyan-400/90">{entry.hash}</span>
                    </div>
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
