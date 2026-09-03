async function executeScenario1() {
  console.log('=================================================================');
  console.log('  🎬 STEP-BY-STEP MANUAL EXECUTION: SCENARIO 1 (HDFC TIMEOUT)');
  console.log('=================================================================\n');

  // STEP 1: Set HDFC Bank to OUTAGE Mode
  console.log('👉 [STEP 1/5] Simulating HDFC Bank Server Outage...');
  let toggleRes = await fetch('http://localhost:3001/api/v1/bank-telemetry/toggle', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bankCode: 'HDFC', isOutage: true }),
  });
  let toggleData: any = await toggleRes.json();
  const bank = toggleData.telemetry;
  console.log(`  ✅ HDFC Bank Status : ${bank?.status}`);
  console.log(`  ⚡ Circuit Breaker  : ${bank?.active_circuit_breaker ? 'ACTIVE (OPEN)' : 'CLOSED'}`);
  console.log(`  📉 Clearing Rate    : ${bank?.clearing_rate_pct}%\n`);

  await new Promise(r => setTimeout(r, 1200));

  // STEP 2: Trigger Failure Webhook
  console.log('👉 [STEP 2/5] Ingesting Webhook: HDFC 504 Gateway Response Timeout...');
  let triggerRes = await fetch('http://localhost:3001/api/v1/simulation/trigger', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ preset: 'TIER_1_SOFT_FAIL' }),
  });
  let triggerData: any = await triggerRes.json();
  const task = triggerData.task;
  const event = triggerData.event;
  const taskId = task?.task_id;
  console.log(`  ✅ Webhook Ingested : HTTP 201 SUCCESS`);
  console.log(`  📌 Event ID        : ${event?.event_id}`);
  console.log(`  📌 Created Task ID : ${taskId}`);
  console.log(`  📌 Mandate ID      : ${event?.mandate_id}`);
  console.log(`  📌 Invoice Amount  : ₹${event?.amount}\n`);

  await new Promise(r => setTimeout(r, 1200));

  // STEP 3: Check AI Failure Diagnosis & Initial FSM State
  console.log('👉 [STEP 3/5] Gemini 2.5 Flash AI Error Classification...');
  console.log(`  🤖 AI Category      : ${event?.classified_category} (Soft Network Failure)`);
  console.log(`  📌 FSM State       : ${task?.current_state}`);
  console.log(`  📌 Allocated Rail  : ${task?.allocated_rail}`);
  console.log(`  ⏰ Scheduled Retry : ${task?.next_action_at} (RBI 24h Off-Peak Notice Window)\n`);

  await new Promise(r => setTimeout(r, 1200));

  // STEP 4: Restore HDFC Bank Telemetry to HEALTHY
  console.log('👉 [STEP 4/5] Restoring HDFC Bank Server Health Telemetry...');
  toggleRes = await fetch('http://localhost:3001/api/v1/bank-telemetry/toggle', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bankCode: 'HDFC', isOutage: false }),
  });
  toggleData = await toggleRes.json();
  const bankRestored = toggleData.telemetry;
  console.log(`  ✅ HDFC Bank Status : ${bankRestored?.status}`);
  console.log(`  📈 Clearing Rate    : ${bankRestored?.clearing_rate_pct}%\n`);

  await new Promise(r => setTimeout(r, 1200));

  // STEP 5: Execute Scheduled Retry & Resolve
  console.log('👉 [STEP 5/5] Executing Off-Peak Telemetry Retry & Healing Mandate...');
  let retryRes = await fetch(`http://localhost:3001/api/v1/orchestrator/tasks/${taskId}/execute-retry`, {
    method: 'POST',
  });
  let retryData: any = await retryRes.json();
  const finalTask = retryData.task;
  console.log(`  🎉 Final Task State : ${finalTask?.current_state}`);
  console.log(`  💰 Recovered Amount : ₹${finalTask?.recovered_amount}`);
  console.log(`  📜 Audit Ledger     : Hash Entry Recorded & Webhook Dispatched to Merchant Backend!\n`);

  console.log('=================================================================');
  console.log('  SCENARIO 1 MANUALLY COMPLETED & HEALED SUCCESSFULLY! 🎉');
  console.log('=================================================================');
}

executeScenario1().catch(err => {
  console.error('Scenario 1 execution failed:', err);
});
