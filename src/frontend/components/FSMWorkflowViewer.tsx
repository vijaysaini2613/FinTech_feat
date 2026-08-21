import React from 'react';
import { ArrowRight, CheckCircle, Clock, AlertTriangle, ShieldCheck, Cpu, Smartphone } from 'lucide-react';

interface FSMWorkflowViewerProps {
  tasks: any[];
  selectedTaskId: string | null;
  onSelectTask: (taskId: string) => void;
}

export const FSMWorkflowViewer: React.FC<FSMWorkflowViewerProps> = ({ tasks, selectedTaskId, onSelectTask }) => {
  const selectedTask = tasks.find(t => t.task_id === selectedTaskId) || tasks[0];

  const states = [
    { id: 'DETECTED', label: 'DETECTED', icon: Clock, desc: 'Webhook Validated & Idempotency Checked' },
    { id: 'DIAGNOSING', label: 'DIAGNOSING', icon: Cpu, desc: 'Hybrid LLM Error Classification' },
    { id: 'SCHEDULED_RETRY', label: 'SCHEDULED_RETRY', icon: Clock, desc: 'Tier 1 Telemetry Delay Window' },
    { id: 'AWAITING_UPI_AUTH', label: 'AWAITING_UPI_AUTH', icon: Smartphone, desc: 'Tier 2 UPI AutoPay Link Provisioned' },
    { id: 'ESCALATED_HITL', label: 'ESCALATED_HITL', icon: AlertTriangle, desc: 'Tier 3 Merchant Approval Queue' },
    { id: 'RESOLVED', label: 'RESOLVED', icon: CheckCircle, desc: 'Revenue Successfully Healed' },
    { id: 'EXHAUSTED', label: 'EXHAUSTED', icon: AlertTriangle, desc: 'Automation Halted' },
  ];

  return (
    <div className="glass-panel p-6 rounded-2xl mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h3 className="font-bold text-slate-100 text-base">Finite State Machine (FSM) Execution Pipeline</h3>
          <p className="text-xs text-slate-400">Strict deterministic state transitions with zero unauthorized debit mutations</p>
        </div>

        {/* Task Selection Dropdown */}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400 font-medium">Active Task:</span>
          <select
            value={selectedTask?.task_id || ''}
            onChange={(e) => onSelectTask(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500 font-mono"
          >
            {tasks.map((t) => (
              <option key={t.task_id} value={t.task_id}>
                {t.task_id.substring(0, 12)}... [{t.current_state}] - ₹{t.failureEvent?.amount || 0}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* FSM Workflow Pipeline Graph */}
      <div className="relative py-4 overflow-x-auto">
        <div className="flex items-center justify-between min-w-[700px] gap-2">
          {states.map((st, idx) => {
            const Icon = st.icon;
            const isActive = selectedTask?.current_state === st.id;
            const isPassed = ['RESOLVED', 'EXHAUSTED'].includes(selectedTask?.current_state) && ['DETECTED', 'DIAGNOSING'].includes(st.id);

            return (
              <React.Fragment key={st.id}>
                <div
                  className={`flex-1 flex flex-col items-center p-3 rounded-xl border text-center transition-all ${
                    isActive
                      ? 'bg-blue-600/20 border-blue-500 shadow-lg shadow-blue-500/20 scale-105'
                      : isPassed
                      ? 'bg-slate-900/80 border-slate-700 opacity-90'
                      : 'bg-slate-950/40 border-slate-850 opacity-60'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 font-bold text-xs ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/40 animate-pulse'
                        : isPassed
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-[11px] text-white tracking-tight">{st.label}</span>
                  <span className="text-[10px] text-slate-400 mt-1 leading-tight hidden sm:block">{st.desc}</span>
                </div>

                {idx < states.length - 1 && (
                  <ArrowRight className="w-4 h-4 text-slate-600 shrink-0" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Selected Task Details Summary Card */}
      {selectedTask && (
        <div className="mt-6 p-4 rounded-xl bg-slate-900/80 border border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block mb-1">Failure Webhook Event:</span>
            <span className="font-mono text-slate-200 block font-semibold">{selectedTask.event_id}</span>
            <span className="text-slate-400 block mt-2">Error Code & Description:</span>
            <span className="text-rose-400 font-mono block">{selectedTask.failureEvent?.raw_error_code || 'N/A'}</span>
            <span className="text-slate-300 block text-[11px] mt-0.5">{selectedTask.failureEvent?.raw_error_description}</span>
          </div>

          <div>
            <span className="text-slate-400 block mb-1">Classified Error Category:</span>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold inline-block bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {selectedTask.failureEvent?.classified_category || 'CLASSIFYING...'}
            </span>
            <span className="text-slate-400 block mt-2">Allocated Recovery Rail:</span>
            <span className="font-mono text-emerald-400 font-semibold block">{selectedTask.allocated_rail || 'DETERMINING...'}</span>
          </div>

          <div>
            <span className="text-slate-400 block mb-1">Invoice Amount & Retry Count:</span>
            <span className="text-base font-extrabold text-white font-mono block">
              ₹{selectedTask.failureEvent?.amount} <span className="text-xs font-normal text-slate-400">({selectedTask.retry_count} retries)</span>
            </span>
            <span className="text-slate-400 block mt-2">Recovery Payment Link:</span>
            {selectedTask.recovery_payment_link ? (
              <a
                href={selectedTask.recovery_payment_link}
                target="_blank"
                rel="noreferrer"
                className="text-blue-400 underline font-mono truncate block hover:text-blue-300"
              >
                {selectedTask.recovery_payment_link}
              </a>
            ) : (
              <span className="text-slate-500 font-mono">None (N/A)</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
