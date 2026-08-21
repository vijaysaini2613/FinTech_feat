import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, RefreshCw, XCircle, ShieldAlert, Sparkles, ExternalLink } from 'lucide-react';

interface HITLReviewQueueProps {
  tasks: any[];
  onReviewDecision: (taskId: string, decision: 'APPROVE_UPI_SWITCH' | 'RETRY_MANUAL' | 'CANCEL') => Promise<void>;
  onOpenCustomerResolution: (taskId: string) => void;
}

export const HITLReviewQueue: React.FC<HITLReviewQueueProps> = ({ tasks, onReviewDecision, onOpenCustomerResolution }) => {
  const [processingId, setProcessingId] = useState<string | null>(null);

  const hitlTasks = tasks.filter(t => t.current_state === 'ESCALATED_HITL');

  const handleAction = async (taskId: string, decision: 'APPROVE_UPI_SWITCH' | 'RETRY_MANUAL' | 'CANCEL') => {
    setProcessingId(taskId);
    try {
      await onReviewDecision(taskId, decision);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="glass-panel p-6 rounded-2xl mb-6 border border-rose-500/20 shadow-lg shadow-rose-500/5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-base">Tier 3 Human-In-The-Loop (HITL) Review Queue</h3>
            <p className="text-xs text-slate-400">High-value invoices (&gt; ₹25,000) or stubborn failures frozen for admin sign-off</p>
          </div>
        </div>

        <span className="px-3 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded-full font-mono text-xs font-bold">
          {hitlTasks.length} Pending Approvals
        </span>
      </div>

      {hitlTasks.length === 0 ? (
        <div className="p-8 rounded-xl bg-slate-900/40 border border-slate-800 text-center">
          <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-2 opacity-80" />
          <h4 className="font-bold text-slate-200 text-sm">HITL Queue Clear</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            No high-value invoices currently require manual review. Autonomous FSM rules are handling all lower-tier retries safely.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {hitlTasks.map((task) => {
            const isProcessing = processingId === task.task_id;
            const event = task.failureEvent;
            const mandate = task.mandate;

            return (
              <div
                key={task.task_id}
                className="p-4 rounded-xl bg-slate-900/90 border border-rose-500/30 hover:border-rose-500/50 transition shadow-md"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3 border-b border-slate-800 pb-3">
                  <div className="flex items-center space-x-3">
                    <span className="px-2.5 py-1 rounded bg-rose-500/20 text-rose-300 font-extrabold text-xs font-mono border border-rose-500/30">
                      HIGH RISK
                    </span>
                    <div>
                      <h4 className="font-bold text-sm text-white">
                        Invoice #{event?.invoice_id || 'INV-9021'} &bull; Customer: {mandate?.customer_email || 'VIP Enterprise Client'}
                      </h4>
                      <span className="text-xs text-slate-400 font-mono">Mandate ID: {task.mandate_id}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">Invoice Amount</span>
                    <span className="text-xl font-extrabold text-white font-mono">
                      ₹{event?.amount?.toLocaleString('en-IN') || '25,000'}
                    </span>
                  </div>
                </div>

                {/* AI Root-Cause Diagnostic Card */}
                <div className="p-3 rounded-lg bg-slate-950/70 border border-indigo-500/20 mb-4 flex items-start space-x-2.5">
                  <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <span className="font-bold text-indigo-300 block mb-0.5">AI Root Cause Analysis & Risk Summary:</span>
                    <p className="text-slate-300 leading-relaxed">
                      Error code <code className="text-indigo-400 font-mono">{event?.raw_error_code}</code> parsed as{' '}
                      <span className="font-bold text-white">{event?.classified_category}</span>.{' '}
                      {event?.amount >= 25000 
                        ? 'Frozen by policy because invoice value exceeds ₹25,000 threshold safety limit.'
                        : 'Frozen because automated retry attempts were exhausted.'}
                    </p>
                  </div>
                </div>

                {/* Single-Click Merchant Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <button
                      disabled={isProcessing}
                      onClick={() => handleAction(task.task_id, 'APPROVE_UPI_SWITCH')}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg flex items-center space-x-1.5 transition shadow-sm shadow-emerald-600/30"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Approve 1-Click UPI Mandate Link</span>
                    </button>

                    <button
                      disabled={isProcessing}
                      onClick={() => handleAction(task.task_id, 'RETRY_MANUAL')}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg flex items-center space-x-1.5 transition shadow-sm shadow-blue-600/30"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Override & Manual Retry</span>
                    </button>

                    <button
                      disabled={isProcessing}
                      onClick={() => handleAction(task.task_id, 'CANCEL')}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-rose-900/50 text-slate-300 hover:text-rose-200 border border-slate-700 font-semibold text-xs rounded-lg flex items-center space-x-1.5 transition"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject & Halt</span>
                    </button>
                  </div>

                  {task.recovery_payment_link && (
                    <button
                      onClick={() => onOpenCustomerResolution(task.task_id)}
                      className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-semibold text-xs rounded-lg flex items-center space-x-1.5 transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Preview Customer Checkout</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
