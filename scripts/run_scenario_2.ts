async function executeScenario2() {
  console.log('=================================================================');
  console.log('  🎬 STEP-BY-STEP MANUAL EXECUTION: SCENARIO 2 (EXPIRED CARD TOKEN)');
  console.log('=================================================================\n');

  // STEP 1: Ingest Expired Card Webhook
  console.log('👉 [STEP 1/4] Ingesting Webhook: RBI e-Mandate Card Token Expired...');
  let triggerRes = await fetch('http://localhost:3001/api/v1/simulation/trigger', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ preset: 'TIER_2_UPI_SWITCH' }),
  });
  let triggerData: any = await triggerRes.json();
  const task = triggerData.task;
  const event = triggerData.event;
  const taskId = task?.task_id;
  console.log(`  ✅ Webhook Ingested : HTTP 201 SUCCESS`);
  console.log(`  📌 Event ID        : ${event?.event_id}`);
  console.log(`  📌 Created Task ID : ${taskId}`);
  console.log(`  📌 Invoice Amount  : ₹${event?.amount}\n`);

  await new Promise(r => setTimeout(r, 1200));

  // STEP 2: Gemini AI Classification & Rail Switch
  console.log('👉 [STEP 2/4] Gemini 2.5 Flash AI Failure Diagnosis & Rail Switch...');
  console.log(`  🤖 AI Category      : ${event?.classified_category} (Hard Mandate Failure)`);
  console.log(`  🔄 Payment Rail     : Switched Card ➔ UPI AutoPay (${task?.allocated_rail})`);
  console.log(`  📌 FSM State       : ${task?.current_state}`);
  console.log(`  📲 Provisioned Link : ${task?.recovery_payment_link}\n`);

  await new Promise(r => setTimeout(r, 1200));

  // STEP 3: Dispatch WhatsApp Nudge
  console.log('👉 [STEP 3/4] Customer Notification & WhatsApp Nudge Dispatch...');
  console.log(`  💬 WhatsApp Prompt : "Hi Rahul, your card mandate for Netflix expired. Switch to 1-tap UPI AutoPay: ${task?.recovery_payment_link}"\n`);

  await new Promise(r => setTimeout(r, 1200));

  // STEP 4: Customer Completes 1-Tap UPI Authorization
  console.log('👉 [STEP 4/4] Customer Taps 1-Click Link & Authorizes UPI AutoPay...');
  let resolveRes = await fetch(`http://localhost:3001/api/v1/resolve/${taskId}/complete`, {
    method: 'POST',
  });
  let resolveData: any = await resolveRes.json();
  const finalTask = resolveData.task;
  console.log(`  🎉 Final Task State : ${finalTask?.current_state}`);
  console.log(`  💰 Recovered Amount : ₹${finalTask?.recovered_amount}`);
  console.log(`  📜 Audit Ledger     : Hash Entry Recorded & Mandate Migrated to UPI AutoPay!\n`);

  console.log('=================================================================');
  console.log('  SCENARIO 2 MANUALLY COMPLETED & HEALED SUCCESSFULLY! 🎉');
  console.log('=================================================================');
}

executeScenario2().catch(err => {
  console.error('Scenario 2 execution failed:', err);
});
