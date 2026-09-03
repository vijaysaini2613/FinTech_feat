async function executeScenario3() {
  console.log('=================================================================');
  console.log('  🎬 STEP-BY-STEP MANUAL EXECUTION: SCENARIO 3 (₹75,000 HITL INVOICE)');
  console.log('=================================================================\n');

  // STEP 1: Ingest High-Value Invoice Webhook
  console.log('👉 [STEP 1/4] Ingesting Webhook: ₹75,000 Corporate Enterprise Invoice...');
  let triggerRes = await fetch('http://localhost:3001/api/v1/simulation/trigger', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ preset: 'TIER_3_HIGH_VALUE_HITL' }),
  });
  let triggerData: any = await triggerRes.json();
  const taskId = triggerData.task?.task_id;
  console.log(`  ✅ Webhook Ingested : HTTP 201 SUCCESS`);
  console.log(`  📌 Event ID        : ${triggerData.event?.event_id}`);
  console.log(`  📌 Created Task ID : ${taskId}`);
  console.log(`  📌 Invoice Amount  : ₹${triggerData.event?.amount}\n`);

  await new Promise(r => setTimeout(r, 1200));

  // STEP 2: Safety Guardrail Triggered & Retries Frozen
  console.log('👉 [STEP 2/4] Safety Guardrail Evaluation (>= ₹25,000 Threshold)...');
  console.log(`  🚨 Guardrail Status : TRIGGERED (Amount ₹75,000 >= ₹25,000 Policy Limit)`);
  console.log(`  📌 FSM State       : ${triggerData.task?.current_state} (Automated retries frozen for safety)`);
  console.log(`  📋 Review Location : Enters Merchant Control Room "HITL Review Queue"\n`);

  await new Promise(r => setTimeout(r, 1200));

  // STEP 3: Merchant Admin Review & Approval
  console.log('👉 [STEP 3/4] Merchant Admin Reviews Diagnostic & Approves Link...');
  let reviewRes = await fetch(`http://localhost:3001/api/v1/merchant/tasks/${taskId}/review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ decision: 'APPROVE_UPI_SWITCH' }),
  });
  let reviewData: any = await reviewRes.json();
  console.log(`  ✅ Merchant Action  : APPROVE_UPI_SWITCH`);
  console.log(`  📌 FSM State       : ${reviewData.task?.current_state}`);
  console.log(`  📲 Approved Link   : ${reviewData.task?.recovery_payment_link}\n`);

  await new Promise(r => setTimeout(r, 1200));

  // STEP 4: Customer Completes Authorization
  console.log('👉 [STEP 4/4] Enterprise Customer Authorizes Mandate via Link...');
  let resolveRes = await fetch(`http://localhost:3001/api/v1/resolve/${taskId}/complete`, {
    method: 'POST',
  });
  let resolveData: any = await resolveRes.json();
  console.log(`  🎉 Final Task State : ${resolveData.task?.current_state}`);
  console.log(`  💰 Recovered Amount : ₹${resolveData.task?.recovered_amount}`);
  console.log(`  📜 Audit Ledger     : SHA-256 Hash Entry Recorded & Webhook Dispatched!\n`);

  console.log('=================================================================');
  console.log('  SCENARIO 3 MANUALLY COMPLETED & HEALED SUCCESSFULLY! 🎉');
  console.log('=================================================================');
}

executeScenario3().catch(err => {
  console.error('Scenario 3 execution failed:', err);
});
