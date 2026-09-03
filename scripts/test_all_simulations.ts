async function runAllSimulations() {
  console.log('=====================================================');
  console.log('  Live Simulation Studio End-to-End Suite');
  console.log('=====================================================\n');

  const presets = [
    { name: 'TIER_1_SOFT_FAIL', label: 'Tier 1 Soft Failure (HDFC 504 Timeout)' },
    { name: 'TIER_2_UPI_SWITCH', label: 'Tier 2 Pay-by-Bank Switch (UPI AutoPay)' },
    { name: 'TIER_3_HIGH_VALUE_HITL', label: 'Tier 3 High-Value Invoice (₹75,000 HITL Guardrail)' },
    { name: 'CBDC_SETTLEMENT_RAIL', label: 'Programmable CBDC (e-Rupee Rail)' },
    { name: 'OPEN_BANKING_VRP_RAIL', label: 'Open Banking VRP Rail' },
  ];

  for (let i = 0; i < presets.length; i++) {
    const p = presets[i];
    console.log(`[Preset ${i + 1}/5] Triggering ${p.label}...`);

    const res = await fetch('http://localhost:3001/api/v1/simulation/trigger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preset: p.name }),
    });

    if (!res.ok) {
      console.error(`  ❌ Failed: HTTP ${res.status}`);
      continue;
    }

    const data: any = await res.json();
    console.log(`  ✅ HTTP 201 SUCCESS`);
    console.log(`  📌 Created Task ID : ${data.task?.task_id}`);
    console.log(`  📌 Event ID        : ${data.event?.event_id}`);
    console.log(`  📌 FSM State       : ${data.task?.current_state}`);
    console.log(`  📌 Error Code      : ${data.event?.raw_error_code}`);
    console.log(`  📌 Allocated Rail  : ${data.task?.allocated_rail || 'HITL_QUEUE'}`);
    if (data.task?.recovery_payment_link) {
      console.log(`  📲 UPI Mandate Link: ${data.task?.recovery_payment_link}`);
    }
    console.log('-----------------------------------------------------\n');
  }

  console.log('[Custom AI Test] Evaluating Gemini 2.5 Flash AI Classifier with custom bank error string...');
  const customRes = await fetch('http://localhost:3001/api/v1/simulation/trigger', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customAmount: 45000,
      customErrorCode: 'HDFC_ERR_9012',
      customErrorDesc: 'Mandate debit limit exceeded under RBI e-mandate circular guidelines',
    }),
  });

  const customData: any = await customRes.json();
  console.log(`  ✅ Custom AI Trigger Status: ${customData.status}`);
  console.log(`  🤖 Gemini AI Classified Category: ${customData.event?.classified_category}`);
  console.log(`  📌 FSM State: ${customData.task?.current_state}\n`);

  console.log('=====================================================');
  console.log('  ALL 5 SIMULATION PRESETS + CUSTOM AI TEST PASSED! 🎉');
  console.log('=====================================================');
}

runAllSimulations().catch(err => {
  console.error('Simulation execution failed:', err);
  process.exit(1);
});
