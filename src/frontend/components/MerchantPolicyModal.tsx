import React, { useState } from 'react';
import { Settings, Save, X, ShieldCheck } from 'lucide-react';

interface MerchantPolicyModalProps {
  policy: {
    merchant_id: string;
    hitl_threshold_amount: number;
    max_automated_retries: number;
    retry_cooldown_hours: number;
    auto_switch_to_upi: boolean;
  };
  onClose: () => void;
  onSave: (updated: any) => Promise<void>;
}

export const MerchantPolicyModal: React.FC<MerchantPolicyModalProps> = ({ policy, onClose, onSave }) => {
  const [hitlThreshold, setHitlThreshold] = useState(policy.hitl_threshold_amount || 25000);
  const [maxRetries, setMaxRetries] = useState(policy.max_automated_retries || 2);
  const [cooldownHours, setCooldownHours] = useState(policy.retry_cooldown_hours || 6);
  const [autoSwitchUPI, setAutoSwitchUPI] = useState(policy.auto_switch_to_upi ?? true);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave({
        hitl_threshold_amount: Number(hitlThreshold),
        max_automated_retries: Number(maxRetries),
        retry_cooldown_hours: Number(cooldownHours),
        auto_switch_to_upi: autoSwitchUPI,
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full bg-slate-800 text-slate-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-base">Merchant Recovery Policy & Controls</h3>
            <p className="text-xs text-slate-400">Configure safety guardrails & FSM thresholds</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              HITL Escalation Threshold (₹):
            </label>
            <input
              type="number"
              value={hitlThreshold}
              onChange={(e) => setHitlThreshold(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xs focus:border-blue-500 focus:outline-none"
            />
            <p className="text-[10px] text-slate-400 mt-1">Invoices $\ge$ this amount freeze automatically for HITL review.</p>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Max Automated Retries Count:
            </label>
            <input
              type="number"
              value={maxRetries}
              onChange={(e) => setMaxRetries(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xs focus:border-blue-500 focus:outline-none"
            />
            <p className="text-[10px] text-slate-400 mt-1">Maximum off-peak retries before escalating to Tier 2/3.</p>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Retry Cooldown Hours:
            </label>
            <input
              type="number"
              value={cooldownHours}
              onChange={(e) => setCooldownHours(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xs focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <div>
              <span className="text-xs font-bold text-white block">Auto-Switch to UPI AutoPay</span>
              <span className="text-[10px] text-slate-400">Generate 1-click mandate link on hard token failure</span>
            </div>
            <input
              type="checkbox"
              checked={autoSwitchUPI}
              onChange={(e) => setAutoSwitchUPI(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-slate-900 border-slate-700"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-blue-600/30 flex items-center justify-center space-x-1.5"
          >
            <Save className="w-4 h-4" />
            <span>Save Merchant Guardrail Policy</span>
          </button>
        </form>
      </div>
    </div>
  );
};
