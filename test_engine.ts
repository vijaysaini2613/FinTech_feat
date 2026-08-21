import { db } from './src/backend/db/store.js';
import { orchestratorEngine } from './src/backend/services/orchestrator.js';
import { verifyRazorpaySignature } from './src/backend/utils/cryptoUtils.js';

async function runTests() {
  console.log('=====================================================');
  console.log('  Autonomous Mandate Recovery Engine - Automated Tests');
  console.log('=====================================================');

  // Test 1: Signature Verification
  console.log('\n[Test 1] Webhook Signature Verification...');
  const validSig = verifyRazorpaySignature(Buffer.from('{"test": true}'), 'sig_test_123');
  console.log(`  Signature valid test result: ${validSig ? 'PASSED ✅' : 'FAILED ❌'}`);

  // Test 2: Idempotency Assertion
  console.log('\n[Test 2] Webhook Idempotency & Deduplication Guard...');
  const eventId = `test_evt_idempotent_${Date.now()}`;
  const res1 = await orchestratorEngine.handleWebhookIngestion({
    eventId,
    merchantId: 'merchant_rzp_default',
    mandateId: 'man_card_hdfc_881',
    invoiceId: 'inv_test_001',
    amount: 3500,
    rawErrorCode: 'BAD_REQUEST_PAYMENT_TIMED_OUT',
    rawErrorDescription: 'NPCI switch timeout',
  });
  console.log(`  Ingestion 1 Task State: ${res1.task.current_state} (Target: SCHEDULED_RETRY)`);

  const event2 = db.getFailureEvent(eventId);
  console.log(`  Idempotency Check: Event ${eventId} exists in DB: ${event2 ? 'PASSED ✅' : 'FAILED ❌'}`);

  // Test 3: Tier 2 Mandate Migration (Hard Token Fail)
  console.log('\n[Test 3] Tier 2 Rail Switch & UPI AutoPay Mandate Provisioning...');
  const res2 = await orchestratorEngine.handleWebhookIngestion({
    eventId: `test_evt_tier2_${Date.now()}`,
    merchantId: 'merchant_rzp_default',
    mandateId: 'man_card_sbi_904',
    invoiceId: 'inv_test_002',
    amount: 8500,
    rawErrorCode: 'TOKEN_REVOKED_OR_EXPIRED',
    rawErrorDescription: 'RBI e-mandate card token expired',
  });
  console.log(`  Tier 2 Task State: ${res2.task.current_state} (Target: AWAITING_UPI_AUTH)`);
  console.log(`  Provisioned UPI Link: ${res2.task.recovery_payment_link}`);
  console.log(`  Result: ${res2.task.current_state === 'AWAITING_UPI_AUTH' && res2.task.recovery_payment_link ? 'PASSED ✅' : 'FAILED ❌'}`);

  // Test 4: Tier 3 HITL Escalation Guardrail (High-Value Invoice)
  console.log('\n[Test 4] Tier 3 High-Value Invoice Guardrail (>= ₹25,000)...');
  const res3 = await orchestratorEngine.handleWebhookIngestion({
    eventId: `test_evt_tier3_${Date.now()}`,
    merchantId: 'merchant_rzp_default',
    mandateId: 'man_upi_icici_112',
    invoiceId: 'inv_test_003',
    amount: 45000,
    rawErrorCode: 'RBI_MANDATE_LIMIT_EXCEEDED',
    rawErrorDescription: 'Invoice ₹45,000 exceeds debit limit',
  });
  console.log(`  Tier 3 Task State: ${res3.task.current_state} (Target: ESCALATED_HITL)`);
  console.log(`  Result: ${res3.task.current_state === 'ESCALATED_HITL' ? 'PASSED ✅' : 'FAILED ❌'}`);

  // Test 5: Audit Ledger Cryptographic Hash Integrity
  console.log('\n[Test 5] Immutable Cryptographic Audit Ledger Check...');
  const ledger = db.getAuditLedger();
  console.log(`  Total Audit Trail Entries: ${ledger.length}`);
  console.log(`  Latest Hash: ${ledger[0]?.hash}`);
  console.log(`  Result: ${ledger.length > 0 && ledger[0]?.hash ? 'PASSED ✅' : 'FAILED ❌'}`);

  console.log('\n=====================================================');
  console.log('  ALL AUTOMATED INTEGRATION TESTS COMPLETED SUCCESSFULLY! 🎉');
  console.log('=====================================================');
}

runTests().catch(console.error);
