import React, { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { MetricsOverview } from './components/MetricsOverview';
import { BankHealthBar, BankTelemetryData } from './components/BankHealthBar';
import { FSMWorkflowViewer } from './components/FSMWorkflowViewer';
import { SimulationStudio } from './components/SimulationStudio';
import { HITLReviewQueue } from './components/HITLReviewQueue';
import { AuditLedgerView } from './components/AuditLedgerView';
import { CustomerResolutionModal } from './components/CustomerResolutionModal';
import { MerchantPolicyModal } from './components/MerchantPolicyModal';
import { ShieldCheck } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [serverStatus, setServerStatus] = useState<'ONLINE' | 'OFFLINE'>('ONLINE');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('theme') as 'dark' | 'light') || 'dark';
  });

  useEffect(() => {
    localStorage.setItem('theme', theme);
    if (theme === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    }
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };
  const [stats, setStats] = useState({
    totalRecoveredARR: 0,
    totalFailedVolume: 0,
    recoveryRatePct: 100,
    autonomousYieldPct: 100,
    churnPreventedCount: 0,
    mttrHours: 1.8,
    totalFailureEvents: 0,
    resolvedCount: 0,
    hitlCount: 0,
    upiMigratedCount: 0,
    scheduledRetryCount: 0,
  });
  const [telemetry, setTelemetry] = useState<Record<string, BankTelemetryData>>({});
  const [tasks, setTasks] = useState<any[]>([]);
  const [ledger, setLedger] = useState<any[]>([]);
  const [policy, setPolicy] = useState<any>({
    merchant_id: 'merchant_rzp_default',
    hitl_threshold_amount: 25000,
    max_automated_retries: 2,
    retry_cooldown_hours: 6,
    auto_switch_to_upi: true,
  });

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [customerModalTaskId, setCustomerModalTaskId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [statsRes, teleRes, tasksRes, ledgerRes, policyRes] = await Promise.all([
        fetch('/api/v1/dashboard/stats'),
        fetch('/api/v1/bank-telemetry'),
        fetch('/api/v1/merchant/tasks'),
        fetch('/api/v1/audit-ledger'),
        fetch('/api/v1/merchant/policy'),
      ]);

      if (statsRes.ok) {
        const d = await statsRes.json();
        setStats(d.stats);
        setServerStatus('ONLINE');
      }
      if (teleRes.ok) {
        const d = await teleRes.json();
        setTelemetry(d.telemetry);
      }
      if (tasksRes.ok) {
        const d = await tasksRes.json();
        setTasks(d.tasks);
        if (d.tasks.length > 0 && !selectedTaskId) {
          setSelectedTaskId(d.tasks[0].task_id);
        }
      }
      if (ledgerRes.ok) {
        const d = await ledgerRes.json();
        setLedger(d.ledger);
      }
      if (policyRes.ok) {
        const d = await policyRes.json();
        setPolicy(d.policy);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setServerStatus('OFFLINE');
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleOutage = async (bankCode: string, isOutage: boolean) => {
    try {
      await fetch('/api/v1/bank-telemetry/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bankCode, isOutage }),
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleTriggerSimulation = async (params: any) => {
    try {
      const res = await fetch('/api/v1/simulation/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.task) {
          setSelectedTaskId(data.task.task_id);
        }
      }
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleReviewDecision = async (taskId: string, decision: 'APPROVE_UPI_SWITCH' | 'RETRY_MANUAL' | 'CANCEL') => {
    try {
      await fetch(`/api/v1/merchant/tasks/${taskId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision }),
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAuthorizeSuccess = async (taskId: string) => {
    try {
      await fetch(`/api/v1/resolve/${taskId}/complete`, {
        method: 'POST',
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSavePolicy = async (updated: any) => {
    try {
      await fetch('/api/v1/merchant/policy', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenCustomerResolution = (taskId: string) => {
    setCustomerModalTaskId(taskId);
    setShowCustomerModal(true);
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white transition-colors duration-200">
      <Header
        serverStatus={serverStatus}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onOpenPolicy={() => setShowPolicyModal(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <main className="flex-1 max-w-[1600px] w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6">
        <MetricsOverview stats={stats} />

        {activeTab === 'overview' && (
          <div className="space-y-6">
            <BankHealthBar telemetry={telemetry} onToggleOutage={handleToggleOutage} />
            <FSMWorkflowViewer tasks={tasks} selectedTaskId={selectedTaskId} onSelectTask={setSelectedTaskId} />
            <SimulationStudio onTriggerSimulation={handleTriggerSimulation} />
            <HITLReviewQueue
              tasks={tasks}
              onReviewDecision={handleReviewDecision}
              onOpenCustomerResolution={handleOpenCustomerResolution}
            />
          </div>
        )}

        {activeTab === 'hitl' && (
          <HITLReviewQueue
            tasks={tasks}
            onReviewDecision={handleReviewDecision}
            onOpenCustomerResolution={handleOpenCustomerResolution}
          />
        )}

        {activeTab === 'fsm' && (
          <FSMWorkflowViewer tasks={tasks} selectedTaskId={selectedTaskId} onSelectTask={setSelectedTaskId} />
        )}

        {activeTab === 'simulator' && (
          <SimulationStudio onTriggerSimulation={handleTriggerSimulation} />
        )}

        {activeTab === 'ledger' && (
          <AuditLedgerView ledger={ledger} />
        )}

        {activeTab === 'bank' && (
          <BankHealthBar telemetry={telemetry} onToggleOutage={handleToggleOutage} />
        )}
      </main>

      {showCustomerModal && (
        <CustomerResolutionModal
          taskId={customerModalTaskId}
          onClose={() => setShowCustomerModal(false)}
          onAuthorizeSuccess={handleAuthorizeSuccess}
        />
      )}

      {showPolicyModal && (
        <MerchantPolicyModal
          policy={policy}
          onClose={() => setShowPolicyModal(false)}
          onSave={handleSavePolicy}
        />
      )}

      <footer className="border-t border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-950 py-4 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-[1600px] mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-blue-500" />
            <span className="font-semibold text-slate-800 dark:text-slate-300">RazorFinOps Churn Healing Engine</span>
            <span>&bull; Track 03: Revenue Recovery</span>
          </div>
          <span className="font-mono text-slate-500 dark:text-slate-400">Strict FSM Money Safety & Cryptographic Audit Ledger</span>
        </div>
      </footer>
    </div>
  );
}
