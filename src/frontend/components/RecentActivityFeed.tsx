import React from 'react';
import { Activity, ArrowRight, CheckCircle, Clock, Smartphone, AlertTriangle, ExternalLink } from 'lucide-react';

interface RecentActivityFeedProps {
  tasks: any[];
  onSelectTask: (taskId: string) => void;
  onOpenCustomerResolution: (taskId: string) => void;
  onGoToTab: (tab: string) => void;
}

export const RecentActivityFeed: React.FC<RecentActivityFeedProps> = ({
  tasks,
  onSelectTask,
  onOpenCustomerResolution,
  onGoToTab,
}) => {
  const recentTasks = tasks.slice(0, 6);

  const getStateBadge = (state: string) => {
    switch (state) {
      case 'RESOLVED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center space-x-1 w-fit">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>HEALED & RESOLVED</span>
          </span>
        );
      case 'AWAITING_UPI_AUTH':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30 flex items-center space-x-1 w-fit">
            <Smartphone className="w-3.5 h-3.5" />
            <span>UPI AUTOPAY LINK SENT</span>
          </span>
        );
      case 'SCHEDULED_RETRY':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30 flex items-center space-x-1 w-fit">
            <Clock className="w-3.5 h-3.5" />
            <span>TELEMETRY RETRY QUEUED</span>
          </span>
        );
      case 'ESCALATED_HITL':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30 flex items-center space-x-1 w-fit">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>MERCHANT HITL QUEUE</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 w-fit">
            {state}
          </span>
        );
    }
  };

  return (
    <div className="glass-panel bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl mb-6 shadow-sm dark:shadow-md">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Live Payment Healing Activity Feed</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">Real-time status of failed recurring mandates being recovered by the engine</p>
          </div>
        </div>

        <button
          onClick={() => onGoToTab('fsm')}
          className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1"
        >
          <span>View Full FSM Pipeline</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-mono font-bold border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="py-3 px-4">Invoice / Mandate</th>
              <th className="py-3 px-4">Error Code</th>
              <th className="py-3 px-4">AI Failure Diagnosis</th>
              <th className="py-3 px-4">Amount (₹)</th>
              <th className="py-3 px-4">Recovery Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80">
            {recentTasks.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-600 dark:text-slate-300 font-medium">
                  No recent payment recovery tasks. Click &quot;Interactive Simulator&quot; to trigger demo failures!
                </td>
              </tr>
            ) : (
              recentTasks.map((t) => {
                const event = t.failureEvent;
                return (
                  <tr key={t.task_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 dark:text-white block">#{event?.invoice_id || 'INV-9000'}</span>
                      <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 block">{t.mandate_id}</span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-rose-600 dark:text-rose-400">
                      {event?.raw_error_code || 'N/A'}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                      {event?.classified_category || 'ISSUER_TIMEOUT'}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      ₹{event?.amount?.toLocaleString('en-IN') || '12,500'}
                    </td>
                    <td className="py-3 px-4">{getStateBadge(t.current_state)}</td>
                    <td className="py-3 px-4 text-right">
                      {t.current_state === 'AWAITING_UPI_AUTH' ? (
                        <button
                          onClick={() => onOpenCustomerResolution(t.task_id)}
                          className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white font-bold text-[11px] rounded-lg transition inline-flex items-center space-x-1"
                        >
                          <span>Test 1-Tap UPI</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      ) : t.current_state === 'ESCALATED_HITL' ? (
                        <button
                          onClick={() => onGoToTab('hitl')}
                          className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] rounded-lg transition inline-flex items-center space-x-1"
                        >
                          <span>Review HITL</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            onSelectTask(t.task_id);
                            onGoToTab('fsm');
                          }}
                          className="px-2.5 py-1 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-[11px] rounded-lg transition"
                        >
                          View Pipeline
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
