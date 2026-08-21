import { db, RecoveryTask, RecoveryState, FailureEvent } from '../db/store.js';
import { failureClassifier } from './classifier.js';
import { telemetryEngine } from './telemetry.js';
import { razorpayClient } from './razorpayClient.js';
import { nudgeService } from './nudgeService.js';
import { cryptoRandomUUID } from '../utils/cryptoUtils.js';
import crypto from 'crypto';

export class OrchestratorEngine {
  /**
   * Step 1: Ingest Webhook and transition task from DETECTED to DIAGNOSING
   */
  public async handleWebhookIngestion(params: {
    eventId: string;
    merchantId: string;
    mandateId: string;
    invoiceId: string;
    amount: number;
    currency?: string;
    rawErrorCode: string;
    rawErrorDescription: string;
  }): Promise<{ event: FailureEvent; task: RecoveryTask }> {
    const merchantId = params.merchantId || 'merchant_rzp_default';
    const currency = params.currency || 'INR';

    const event: FailureEvent = {
      event_id: params.eventId,
      merchant_id: merchantId,
      mandate_id: params.mandateId,
      invoice_id: params.invoiceId,
      amount: params.amount,
      currency,
      raw_error_code: params.rawErrorCode,
      raw_error_description: params.rawErrorDescription,
      classified_category: 'UNKNOWN',
      ingested_at: new Date().toISOString(),
    };
    db.createFailureEvent(event);

    const taskId = cryptoRandomUUID();
    const now = new Date().toISOString();
    const task: RecoveryTask = {
      task_id: taskId,
      event_id: params.eventId,
      merchant_id: merchantId,
      mandate_id: params.mandateId,
      current_state: 'DETECTED',
      retry_count: 0,
      next_action_at: null,
      allocated_rail: null,
      recovery_payment_link: null,
      recovered_amount: 0.00,
      created_at: now,
      updated_at: now,
    };
    db.createRecoveryTask(task);

    db.addAuditLedgerEntry({
      task_id: taskId,
      actor: 'SYSTEM_DAEMON',
      previous_state: null,
      new_state: 'DETECTED',
      action_type: 'WEBHOOK_INGESTED',
      metadata: { eventId: params.eventId, invoiceId: params.invoiceId, amount: params.amount }
    });

    const diagnosedTask = await this.diagnoseTask(taskId);
    return { event, task: diagnosedTask };
  }

  /**
   * Step 2: DIAGNOSING State Transition Engine with Concurrency Defense Lock
   */
  public async diagnoseTask(taskId: string): Promise<RecoveryTask> {
    // Concurrency Lock: SELECT FOR UPDATE semantics
    if (!db.acquireTaskLock(taskId)) {
      const existing = db.getRecoveryTask(taskId);
      if (existing) return existing;
    }

    try {
      const task = db.getRecoveryTask(taskId);
      if (!task) throw new Error(`Recovery Task ${taskId} not found`);
      const event = db.getFailureEvent(task.event_id);
      if (!event) throw new Error(`Failure Event ${task.event_id} not found`);

      const policy = db.getMerchantPolicy(task.merchant_id);

      const prevState = task.current_state;
      db.updateRecoveryTask(taskId, { current_state: 'DIAGNOSING' });
      db.addAuditLedgerEntry({
        task_id: taskId,
        actor: 'SYSTEM_DAEMON',
        previous_state: prevState,
        new_state: 'DIAGNOSING',
        action_type: 'DIAGNOSIS_STARTED',
        metadata: { rawCode: event.raw_error_code, rawDesc: event.raw_error_description }
      });

      const classification = await failureClassifier.classify(event.raw_error_code, event.raw_error_description);
      event.classified_category = classification.category;
      db.createFailureEvent(event);

      db.addAuditLedgerEntry({
        task_id: taskId,
        actor: 'LLM_CLASSIFIER',
        previous_state: 'DIAGNOSING',
        new_state: 'DIAGNOSING',
        action_type: 'CLASSIFICATION_COMPLETE',
        metadata: { classification }
      });

      // GUARDRAIL 1: Escalation to HITL
      if (event.amount >= policy.hitl_threshold_amount || task.retry_count >= policy.max_automated_retries) {
        const updated = db.updateRecoveryTask(taskId, {
          current_state: 'ESCALATED_HITL',
          allocated_rail: null,
        });

        db.addAuditLedgerEntry({
          task_id: taskId,
          actor: 'SYSTEM_DAEMON',
          previous_state: 'DIAGNOSING',
          new_state: 'ESCALATED_HITL',
          action_type: 'ESCALATE_HITL_GUARDRAIL',
          metadata: {
            reason: event.amount >= policy.hitl_threshold_amount 
              ? `Invoice amount ₹${event.amount} exceeds HITL threshold ₹${policy.hitl_threshold_amount}`
              : `Retry count ${task.retry_count} reached maximum threshold ${policy.max_automated_retries}`,
            classification,
          }
        });
        return updated;
      }

      // GUARDRAIL 2: Transient Failures -> RBI 24h Pre-Debit Compliant SCHEDULED_RETRY
      if (classification.isTransient) {
        const mandate = db.getMandate(task.mandate_id);
        const bankCode = mandate ? mandate.bank_bin : 'HDFC';
        const health = telemetryEngine.checkBankHealth(bankCode);

        const rbiCheck = telemetryEngine.calculateRBICompliantRetryTime(health.recommendedDelayHours, null);

        const updated = db.updateRecoveryTask(taskId, {
          current_state: 'SCHEDULED_RETRY',
          allocated_rail: 'BACKGROUND_RETRY',
          next_action_at: rbiCheck.retryTimestamp,
        });

        db.addAuditLedgerEntry({
          task_id: taskId,
          actor: 'SYSTEM_DAEMON',
          previous_state: 'DIAGNOSING',
          new_state: 'SCHEDULED_RETRY',
          action_type: 'TELEMETRY_SCHEDULE_RBI_COMPLIANT',
          metadata: {
            bankCode,
            bankHealth: health.telemetry,
            scheduledFor: rbiCheck.retryTimestamp,
            rbiNoticeEnforced: rbiCheck.rbiNoticeEnforced,
            preDebitComplianceWindow: '24 Hours Mandatory RBI Offset Enforced',
          }
        });
        return updated;
      }

      // GUARDRAIL 3: Hard Token Failures -> AWAITING_UPI_AUTH
      const mandate = db.getMandate(task.mandate_id);
      const upiLink = await razorpayClient.createUPIAutoPayMandateLink({
        customerId: mandate ? mandate.customer_id : 'cust_unknown',
        customerEmail: mandate ? mandate.customer_email : 'customer@example.com',
        customerPhone: mandate ? mandate.customer_phone : '+919876543210',
        amount: event.amount,
        description: `Mandate Migration for Invoice ${event.invoice_id}`,
      });

      const nudge = nudgeService.generateUPIMigrationNudge({
        taskId,
        customerName: mandate ? mandate.customer_id.replace('cust_', '').replace('_', ' ') : 'Valued Customer',
        customerPhone: mandate ? mandate.customer_phone : '+919876543210',
        customerEmail: mandate ? mandate.customer_email : 'customer@example.com',
        amount: event.amount,
        merchantName: 'Enterprise SaaS Services',
        mandateLink: upiLink.short_url,
      });

      const updated = db.updateRecoveryTask(taskId, {
        current_state: 'AWAITING_UPI_AUTH',
        allocated_rail: 'UPI_AUTOPAY_MIGRATION',
        recovery_payment_link: upiLink.short_url,
      });

      db.addAuditLedgerEntry({
        task_id: taskId,
        actor: 'SYSTEM_DAEMON',
        previous_state: 'DIAGNOSING',
        new_state: 'AWAITING_UPI_AUTH',
        action_type: 'PROVISION_UPI_MANDATE',
        metadata: {
          mandateLink: upiLink.short_url,
          dunningNudge: nudge,
          rateLimitingPolicy: 'Max 2 Nudges per Invoice (T+0, T+24h)',
        }
      });

      return updated;
    } finally {
      db.releaseTaskLock(taskId);
    }
  }

  /**
   * Step 3: Execute Retry with Concurrency Lock Defense
   */
  public async executeRetry(taskId: string): Promise<RecoveryTask> {
    if (!db.acquireTaskLock(taskId)) {
      const existing = db.getRecoveryTask(taskId);
      if (existing) return existing;
    }

    try {
      const task = db.getRecoveryTask(taskId);
      if (!task) throw new Error(`Task ${taskId} not found`);

      const event = db.getFailureEvent(task.event_id);
      const newRetryCount = task.retry_count + 1;

      const result = await razorpayClient.executeRecurringDebit(task.mandate_id, event ? event.amount : 5000);

      if (result.success) {
        const updated = db.updateRecoveryTask(taskId, {
          current_state: 'RESOLVED',
          retry_count: newRetryCount,
          recovered_amount: event ? event.amount : 5000,
          next_action_at: null,
        });

        db.addAuditLedgerEntry({
          task_id: taskId,
          actor: 'SYSTEM_DAEMON',
          previous_state: 'SCHEDULED_RETRY',
          new_state: 'RESOLVED',
          action_type: 'RETRY_SUCCESSFUL',
          metadata: { paymentId: result.paymentId, retryCount: newRetryCount, amountRecovered: event?.amount }
        });

        await this.dispatchMerchantRecoveryWebhook(updated, event);

        return updated;
      } else {
        db.updateRecoveryTask(taskId, { retry_count: newRetryCount });

        db.addAuditLedgerEntry({
          task_id: taskId,
          actor: 'SYSTEM_DAEMON',
          previous_state: 'SCHEDULED_RETRY',
          new_state: 'DIAGNOSING',
          action_type: 'RETRY_ATTEMPT_FAILED',
          metadata: { errorCode: result.errorCode, errorDesc: result.errorDesc, attempt: newRetryCount }
        });

        return await this.diagnoseTask(taskId);
      }
    } finally {
      db.releaseTaskLock(taskId);
    }
  }

  /**
   * Step 4: Complete UPI Authorization with Concurrency Lock Defense
   */
  public async completeUPIAuthorization(taskId: string): Promise<RecoveryTask> {
    if (!db.acquireTaskLock(taskId)) {
      const existing = db.getRecoveryTask(taskId);
      if (existing) return existing;
    }

    try {
      const task = db.getRecoveryTask(taskId);
      if (!task) throw new Error(`Task ${taskId} not found`);
      const event = db.getFailureEvent(task.event_id);

      const updated = db.updateRecoveryTask(taskId, {
        current_state: 'RESOLVED',
        recovered_amount: event ? event.amount : 0,
        next_action_at: null,
      });

      if (task.mandate_id) {
        const mandate = db.getMandate(task.mandate_id);
        if (mandate) {
          mandate.payment_rail = 'UPI_AUTOPAY';
          mandate.status = 'ACTIVE';
          db.upsertMandate(mandate);
        }
      }

      db.addAuditLedgerEntry({
        task_id: taskId,
        actor: 'CUSTOMER',
        previous_state: 'AWAITING_UPI_AUTH',
        new_state: 'RESOLVED',
        action_type: 'UPI_MANDATE_AUTHORIZED',
        metadata: { recoveredAmount: event?.amount, newRail: 'UPI_AUTOPAY' }
      });

      await this.dispatchMerchantRecoveryWebhook(updated, event);

      return updated;
    } finally {
      db.releaseTaskLock(taskId);
    }
  }

  public async cancelSubscriptionByCustomer(taskId: string): Promise<RecoveryTask> {
    const task = db.getRecoveryTask(taskId);
    if (!task) throw new Error(`Task ${taskId} not found`);

    nudgeService.triggerKillSwitch(taskId);

    const updated = db.updateRecoveryTask(taskId, {
      current_state: 'EXHAUSTED',
    });

    db.addAuditLedgerEntry({
      task_id: taskId,
      actor: 'CUSTOMER',
      previous_state: task.current_state,
      new_state: 'EXHAUSTED',
      action_type: 'CUSTOMER_CANCELLED_KILL_SWITCH',
      metadata: { reason: 'Customer clicked Cancel Subscription on resolution page. Dunning halted.' }
    });

    return updated;
  }

  private async dispatchMerchantRecoveryWebhook(task: RecoveryTask, event: FailureEvent | null): Promise<void> {
    const payload = {
      event: 'razorfinops.payment.recovered',
      event_id: `evt_rec_${Date.now()}`,
      task_id: task.task_id,
      merchant_id: task.merchant_id,
      invoice_id: event ? event.invoice_id : 'inv_unknown',
      mandate_id: task.mandate_id,
      amount_recovered: task.recovered_amount,
      allocated_rail: task.allocated_rail,
      recovered_at: new Date().toISOString(),
      action: 'REACTIVATE_SUBSCRIPTION_ACCESS',
    };

    const payloadStr = JSON.stringify(payload);
    const signature = crypto.createHmac('sha256', 'merchant_webhook_secret_key').update(payloadStr).digest('hex');

    console.log(`[Merchant Outgoing Webhook Dispatcher] Emitting signed 'razorfinops.payment.recovered' webhook:`);
    console.log(`  Signature: ${signature}`);

    db.addAuditLedgerEntry({
      task_id: task.task_id,
      actor: 'SYSTEM_DAEMON',
      previous_state: 'RESOLVED',
      new_state: 'RESOLVED',
      action_type: 'MERCHANT_OUTGOING_WEBHOOK_DISPATCHED',
      metadata: {
        merchantEndpoint: 'https://merchant.example.com/api/webhooks/recovered',
        signature,
        payload,
      }
    });
  }

  public async handleMerchantReview(taskId: string, decision: 'APPROVE_UPI_SWITCH' | 'RETRY_MANUAL' | 'CANCEL'): Promise<RecoveryTask> {
    const task = db.getRecoveryTask(taskId);
    if (!task) throw new Error(`Task ${taskId} not found`);
    const event = db.getFailureEvent(task.event_id);

    if (decision === 'APPROVE_UPI_SWITCH') {
      const mandate = db.getMandate(task.mandate_id);
      const upiLink = await razorpayClient.createUPIAutoPayMandateLink({
        customerId: mandate ? mandate.customer_id : 'cust_hitl',
        customerEmail: mandate ? mandate.customer_email : 'customer@example.com',
        customerPhone: mandate ? mandate.customer_phone : '+919876543210',
        amount: event ? event.amount : 25000,
        description: `HITL Approved UPI AutoPay Migration`,
      });

      const updated = db.updateRecoveryTask(taskId, {
        current_state: 'AWAITING_UPI_AUTH',
        allocated_rail: 'UPI_AUTOPAY_MIGRATION',
        recovery_payment_link: upiLink.short_url,
      });

      db.addAuditLedgerEntry({
        task_id: taskId,
        actor: 'MERCHANT_ADMIN',
        previous_state: 'ESCALATED_HITL',
        new_state: 'AWAITING_UPI_AUTH',
        action_type: 'HITL_APPROVED_UPI_SWITCH',
        metadata: { decision, mandateLink: upiLink.short_url }
      });
      return updated;
    } else if (decision === 'RETRY_MANUAL') {
      const updated = db.updateRecoveryTask(taskId, {
        current_state: 'SCHEDULED_RETRY',
        allocated_rail: 'BACKGROUND_RETRY',
        next_action_at: new Date().toISOString(),
      });

      db.addAuditLedgerEntry({
        task_id: taskId,
        actor: 'MERCHANT_ADMIN',
        previous_state: 'ESCALATED_HITL',
        new_state: 'SCHEDULED_RETRY',
        action_type: 'HITL_MANUAL_RETRY_OVERRIDE',
        metadata: { decision }
      });
      
      return await this.executeRetry(taskId);
    } else {
      const updated = db.updateRecoveryTask(taskId, {
        current_state: 'EXHAUSTED',
      });

      db.addAuditLedgerEntry({
        task_id: taskId,
        actor: 'MERCHANT_ADMIN',
        previous_state: 'ESCALATED_HITL',
        new_state: 'EXHAUSTED',
        action_type: 'HITL_REJECTED_HALT',
        metadata: { decision }
      });
      return updated;
    }
  }
}

export const orchestratorEngine = new OrchestratorEngine();
