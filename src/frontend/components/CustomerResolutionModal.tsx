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
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full bg-slate-800 text-slate-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        {cancelled ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto mb-4">
              <AlertOctagon className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-extrabold text-white mb-2">Subscription Cancelled</h3>
            <p className="text-xs text-slate-300 mb-6 leading-relaxed">
              Your subscription has been cancelled. Automated dunning notifications have been immediately halted per the Customer Dunning Policy Engine.
            </p>
            <button
              onClick={onClose}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm rounded-xl transition"
            >
              Close Window
            </button>
          </div>
        ) : authorized ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4 animate-bounce">
              <CheckCircle className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-extrabold text-white mb-2">UPI AutoPay Mandate Active!</h3>
            <p className="text-xs text-slate-300 mb-6 leading-relaxed">
              Your recurring subscription mandate has been successfully migrated to UPI AutoPay. Your merchant access is fully restored.
            </p>
            <button
              onClick={onClose}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition shadow-lg shadow-emerald-600/30"
            >
              Done & Return to Merchant
            </button>
          </div>
        ) : (
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-100 text-base">Re-Authorize UPI AutoPay Mandate</h3>
                <p className="text-xs text-slate-400">1-Tap RBI Compliant e-Mandate Migration</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 mb-5">
              <div className="flex justify-between items-center text-xs mb-2">
                <span className="text-slate-400">Merchant:</span>
                <span className="font-bold text-white">Enterprise SaaS India</span>
              </div>
              <div className="flex justify-between items-center text-xs mb-2">
                <span className="text-slate-400">Recurring Frequency:</span>
                <span className="font-mono text-slate-300">Monthly Auto-Debit</span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-800 pt-2">
                <span className="text-xs text-slate-400 font-semibold">Max Debit Limit:</span>
                <span className="text-lg font-extrabold text-purple-400 font-mono">₹14,999 / mo</span>
              </div>
            </div>

            <div className="mb-4">
              <label className="text-xs font-semibold text-slate-300 block mb-2">Select Your Installed UPI App:</label>
              <div className="grid grid-cols-2 gap-2">
                {['Google Pay', 'PhonePe', 'Paytm', 'BHIM UPI'].map((appName) => (
                  <button
                    key={appName}
                    type="button"
                    onClick={() => setSelectedApp(appName)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-between transition ${
                      selectedApp === appName
                        ? 'bg-purple-600/20 border-purple-500 text-white shadow-md shadow-purple-500/20'
                        : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>{appName}</span>
                    {selectedApp === appName && <CheckCircle className="w-3.5 h-3.5 text-purple-400" />}
                  </button>
                ))}
              </div>
            </div>

            <button
              disabled={loading}
              onClick={handleAuthorize}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-sm rounded-xl transition shadow-lg shadow-purple-600/30 flex items-center justify-center space-x-2 mb-3"
            >
              {loading ? (
                <span>Authorizing in {selectedApp}...</span>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>Authorize Mandate in {selectedApp}</span>
                </>
              )}
            </button>

            {/* Dunning Kill Switch Button */}
            <button
              type="button"
              disabled={loading}
              onClick={handleCancelSubscription}
              className="w-full py-2 bg-slate-800/80 hover:bg-rose-900/40 text-slate-400 hover:text-rose-300 font-semibold text-xs rounded-xl transition border border-slate-700 hover:border-rose-500/30"
            >
              Cancel Subscription (Halt All Automated Nudges)
            </button>

            <div className="flex items-center justify-center space-x-1 text-[10px] text-slate-500 mt-3">
              <ShieldCheck className="w-3 h-3 text-slate-500" />
              <span>Secured by NPCI & Razorpay 256-Bit Cryptographic Rail</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
