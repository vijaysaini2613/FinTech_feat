#!/usr/bin/env python3
"""
RazorFinOps AI Agent - CLI Mock Event Harness for Live Demo
Deterministic interactive simulation script with 3 hotkeys:
  [1] Emits HDFC bank timeout (Tests Tier 1 Telemetry Delay & RBI 24h Pre-Debit Compliance).
  [2] Emits RBI expired card token (Tests Tier 2 UPI AutoPay WhatsApp link & Dunning Policy).
  [3] Emits ₹75,000 enterprise failure (Tests Tier 3 HITL Dashboard Circuit Breaker).
"""

import hmac
import hashlib
import json
import time
import sys
import urllib.request
import urllib.error

WEBHOOK_URL = "http://localhost:3001/api/v1/webhooks/razorpay"
WEBHOOK_SECRET = "test_webhook_secret_key"

def generate_signature(payload_bytes: bytes, secret: str) -> str:
    return hmac.new(
        key=secret.encode("utf-8"),
        msg=payload_bytes,
        digestmod=hashlib.sha256
    ).hexdigest()

def fire_payload(event_type: str, event_id: str, amount_inr: float, error_code: str, error_desc: str, mandate_id: str):
    payload = {
        "entity": "event",
        "account_id": "merchant_rzp_default",
        "event": event_type,
        "event_id": event_id,
        "payload": {
            "payment": {
                "entity": {
                    "id": f"pay_{event_id}",
                    "amount": int(amount_inr * 100),
                    "currency": "INR",
                    "status": "failed",
                    "invoice_id": f"inv_demo_{event_id[-6:]}",
                    "token_id": mandate_id,
                    "error_code": error_code,
                    "error_description": error_desc,
                    "created_at": int(time.time())
                }
            }
        },
        "created_at": int(time.time())
    }

    raw_bytes = json.dumps(payload).encode("utf-8")
    signature = generate_signature(raw_bytes, WEBHOOK_SECRET)

    req = urllib.request.Request(
        WEBHOOK_URL,
        data=raw_bytes,
        headers={
            "Content-Type": "application/json",
            "X-Razorpay-Signature": signature,
            "X-Razorpay-Event-Id": event_id,
        },
        method="POST"
    )

    print(f"\n=======================================================")
    print(f"🚀 Firing Live Webhook Payload [{event_id}]")
    print(f"   Event: {event_type} | Invoice Amount: ₹{amount_inr:,.2f}")
    print(f"   Error Code: {error_code}")
    print(f"   Description: {error_desc}")
    print(f"=======================================================")

    try:
        with urllib.request.urlopen(req) as response:
            res_body = response.read().decode("utf-8")
            print(f"✅ Engine Response [HTTP {response.status}]:")
            parsed = json.loads(res_body)
            print(json.dumps(parsed, indent=2))
    except urllib.error.HTTPError as e:
        print(f"❌ HTTP Error [{e.code}]: {e.read().decode('utf-8')}")
    except Exception as err:
        print(f"❌ Connection Error: {err}")
        print("   Please make sure backend server is running on http://localhost:3001")

def interactive_loop():
    print("=======================================================================")
    print("  RazorFinOps AI Agent - Live Demo Mock Event Harness (3 Hotkeys)")
    print("=======================================================================")
    print("  Press [1]: HDFC Bank Timeout (Tests Tier 1 Telemetry Delay & RBI 24h Compliance)")
    print("  Press [2]: RBI Expired Card Token (Tests Tier 2 UPI AutoPay WhatsApp Provisioning)")
    print("  Press [3]: ₹75,000 Enterprise Failure (Tests Tier 3 HITL Dashboard Circuit Breaker)")
    print("  Press [q]: Quit Harness")
    print("=======================================================================")

    while True:
        try:
            key = input("\n[HOTKEY] Choose option (1, 2, 3 or q): ").strip()
            ts = int(time.time())

            if key == "1":
                fire_payload(
                    event_type="subscription.charged_failed",
                    event_id=f"evt_demo_hdfc_{ts}",
                    amount_inr=3500.0,
                    error_code="BAD_REQUEST_PAYMENT_TIMED_OUT",
                    error_desc="HDFC Netbanking 504 gateway response timeout during recurring debit",
                    mandate_id="man_card_hdfc_881"
                )
            elif key == "2":
                fire_payload(
                    event_type="subscription.charged_failed",
                    event_id=f"evt_demo_expired_{ts}",
                    amount_inr=8500.0,
                    error_code="TOKEN_REVOKED_OR_EXPIRED",
                    error_desc="RBI e-mandate card token expired or deleted by issuing bank",
                    mandate_id="man_card_sbi_904"
                )
            elif key == "3":
                fire_payload(
                    event_type="payment.failed",
                    event_id=f"evt_demo_hitl_{ts}",
                    amount_inr=75000.0,
                    error_code="RBI_MANDATE_LIMIT_EXCEEDED",
                    error_desc="Invoice amount ₹75,000 exceeds registered debit limit under RBI e-mandate guidelines",
                    mandate_id="man_upi_icici_112"
                )
            elif key.lower() == "q":
                print("Exiting demo harness.")
                break
            else:
                print("Invalid hotkey. Please press 1, 2, 3, or q.")
        except KeyboardInterrupt:
            print("\nExiting demo harness.")
            break

if __name__ == "__main__":
    interactive_loop()
