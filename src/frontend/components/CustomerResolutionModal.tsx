import React, { useState } from 'react';
import { Smartphone, CheckCircle, ShieldCheck, Zap, X, AlertOctagon } from 'lucide-react';

interface CustomerResolutionModalProps {
  taskId: string | null;
  onClose: () => void;
  onAuthorizeSuccess: (taskId: string) => Promise<void>;
}

export const CustomerResolutionModal: React.FC<CustomerResolutionModalProps> = ({ taskId, onClose, onAuthorizeSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [selectedApp, setSelectedApp] = useState('Google Pay');

  if (!taskId) return null;

  const handleAuthorize = async () => {
    setLoading(true);
    try {
      await onAuthorizeSuccess(taskId);
      setAuthorized(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    setLoading(true);
    try {
      await fetch(`/api/v1/resolve/${taskId}/cancel`, { method: 'POST' });
      setCancelled(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden text-slate-900 dark:text-white">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        {cancelled ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-rose-500/20 text-rose-500 dark:text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto mb-4">
              <AlertOctagon className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-2">Subscription Cancelled</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mb-6 leading-relaxed font-medium">
              Your subscription has been cancelled. Automated dunning notifications have been immediately halted per the Customer Dunning Policy Engine.
            </p>
            <button
              onClick={onClose}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl transition"
            >
              Close Window
            </button>
          </div>
        ) : authorized ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-500 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-2">UPI AutoPay Mandate Active! 🎉</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mb-4 leading-relaxed font-medium">
              Your recurring subscription has been migrated to UPI AutoPay. Future payments will automatically process without card drops.
            </p>
            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono text-emerald-600 dark:text-emerald-400 mb-6 font-bold">
              Mandate State: RESOLVED &bull; Task ID: {taskId.substring(0, 10)}...
            </div>
            <button
              onClick={onClose}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition shadow-lg shadow-emerald-600/30"
            >
              Return to Control Room
            </button>
          </div>
        ) : (
          <div>
            {/* Header branding */}
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20 shrink-0">
                <Smartphone className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold tracking-wider text-purple-600 dark:text-purple-400 uppercase block">1-Tap Pay-by-Bank Migration</span>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">Authorize UPI AutoPay Mandate</h3>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 mb-4 leading-relaxed font-medium">
              Your recurring card payment was paused per RBI e-mandate guidelines. Switch to UPI AutoPay in 1-tap for zero-drop recurring billing.
            </p>

            {/* UPI App Selection Grid */}
            <div className="space-y-2 mb-6">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Select UPI App:</label>
              {['Google Pay', 'PhonePe', 'Paytm', 'BHIM UPI'].map((app) => (
                <button
                  key={app}
                  onClick={() => setSelectedApp(app)}
                  className={`w-full p-3 rounded-xl border flex items-center justify-between transition text-xs font-bold ${
                    selectedApp === app
                      ? 'bg-purple-500/10 border-purple-500 text-purple-700 dark:text-purple-300 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span>{app}</span>
                  {selectedApp === app && <CheckCircle className="w-4 h-4 text-purple-600 dark:text-purple-400" />}
                </button>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                disabled={loading}
                onClick={handleAuthorize}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-sm rounded-xl transition shadow-lg shadow-purple-600/30 flex items-center justify-center space-x-2"
              >
                <Zap className="w-4 h-4" />
                <span>{loading ? 'Authorizing UPI Mandate...' : `Authorize Mandate via ${selectedApp}`}</span>
              </button>

              <button
                disabled={loading}
                onClick={handleCancelSubscription}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-950 dark:hover:bg-slate-800 text-rose-600 dark:text-rose-400 font-bold text-xs rounded-xl transition border border-rose-500/20"
              >
                Cancel Subscription & Stop Nudges
              </button>
            </div>

            {/* Security Badge */}
            <div className="mt-4 flex items-center justify-center space-x-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
              <span>Razorpay NPCI 256-Bit Encrypted & RBI Compliant</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
