#!/usr/bin/env python3
"""
RazorFinOps AI Agent - Hackathon Interactive CLI Simulator
Fires realistic Razorpay failure webhook payloads with valid HMAC-SHA256 signatures to test
Tier 1 (Telemetry Retry), Tier 2 (UPI AutoPay Migration), and Tier 3 (HITL Guardrail).
"""

import hmac
import hashlib
import json
import time
import sys
import urllib.request
import urllib.error

# Configuration
WEBHOOK_URL = "http://localhost:3001/api/v1/webhooks/razorpay"
WEBHOOK_SECRET = "test_webhook_secret_key"

def generate_signature(payload_bytes: bytes, secret: str) -> str:
    return hmac.new(
        key=secret.encode("utf-8"),
        msg=payload_bytes,
        digestmod=hashlib.sha256
    ).hexdigest()

def send_webhook(event_type: str, event_id: str, amount_inr: float, error_code: str, error_desc: str, mandate_id: str):
    amount_paise = int(amount_inr * 100)
    payload = {
        "entity": "event",
        "account_id": "merchant_rzp_default",
        "event": event_type,
        "event_id": event_id,
        "contains": ["payment"],
        "payload": {
            "payment": {
                "entity": {
                    "id": f"pay_{event_id}",
                    "amount": amount_paise,
                    "currency": "INR",
                    "status": "failed",
                    "order_id": f"order_{event_id}",
                    "invoice_id": f"inv_{event_id[-8:]}",
                    "international": False,
                    "method": "card",
                    "amount_refunded": 0,
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

    print(f"\n--- Firing Webhook Payload [{event_id}] ---")
    print(f"  Event: {event_type} | Amount: ₹{amount_inr} | Error: {error_code}")
    print(f"  Error Description: {error_desc}")

    try:
        with urllib.request.urlopen(req) as response:
            res_body = response.read().decode("utf-8")
            print(f"  [HTTP {response.status}] Engine Response:")
            print(f"  {res_body}")
    except urllib.error.HTTPError as e:
        print(f"  [HTTP {e.code}] Error Response:")
        print(f"  {e.read().decode('utf-8')}")
    except Exception as err:
        print(f"  [Connection Error]: {err}")
        print("  Make sure the backend server is running on http://localhost:3001")

def main():
    print("=======================================================================")
    print("  RazorFinOps AI Agent - Interactive CLI Hackathon Test Simulator")
    print("=======================================================================")
    print("Select test scenario to execute:")
    print(" 1. Scenario A: HDFC Bank Netbanking 504 Timeout (Tier 1 Telemetry Retry)")
    print(" 2. Scenario B: Expired e-Mandate Token (Tier 2 UPI AutoPay Migration)")
    print(" 3. Scenario C: ₹45,000 High-Value Invoice Failure (Tier 3 HITL Escalation)")
    print(" 4. Scenario D: Replay Attack (Send duplicate event_id 3x)")
    print(" 5. Run All Scenarios Sequentially")

    choice = input("\nEnter choice (1-5): ").strip()
    ts = int(time.time())

    if choice == "1":
        send_webhook(
            event_type="subscription.charged_failed",
            event_id=f"evt_tier1_{ts}",
            amount_inr=3500.0,
            error_code="BAD_REQUEST_PAYMENT_TIMED_OUT",
            error_desc="HDFC Netbanking gateway timed out during recurring debit",
            mandate_id="man_card_hdfc_881"
        )
    elif choice == "2":
        send_webhook(
            event_type="subscription.charged_failed",
            event_id=f"evt_tier2_{ts}",
            amount_inr=8500.0,
            error_code="TOKEN_REVOKED_OR_EXPIRED",
            error_desc="RBI e-mandate card token expired or deleted by card issuing bank",
            mandate_id="man_card_sbi_904"
        )
    elif choice == "3":
        send_webhook(
            event_type="payment.failed",
            event_id=f"evt_tier3_{ts}",
            amount_inr=45000.0,
            error_code="RBI_MANDATE_LIMIT_EXCEEDED",
            error_desc="Invoice amount ₹45,000 exceeds registered debit limit under RBI e-mandate guidelines",
            mandate_id="man_upi_icici_112"
        )
    elif choice == "4":
        dup_id = f"evt_replay_{ts}"
        print(f"\nSending duplicate event {dup_id} 3 times...")
        for i in range(1, 4):
            print(f"\n--> Attempt {i}:")
            send_webhook(
                event_type="payment.failed",
                event_id=dup_id,
                amount_inr=5000.0,
                error_code="GATEWAY_TIMED_OUT",
                error_desc="Transient NPCI gateway error",
                mandate_id="man_card_hdfc_881"
            )
            time.sleep(0.5)
    elif choice == "5":
        print("\nExecuting full 3-tier benchmark test suite...")
        send_webhook("subscription.charged_failed", f"evt_t1_{ts}", 3500.0, "BAD_REQUEST_PAYMENT_TIMED_OUT", "HDFC Netbanking 504 Timeout", "man_card_hdfc_881")
        time.sleep(1)
        send_webhook("subscription.charged_failed", f"evt_t2_{ts}", 8500.0, "TOKEN_REVOKED_OR_EXPIRED", "RBI e-mandate token expired", "man_card_sbi_904")
        time.sleep(1)
        send_webhook("payment.failed", f"evt_t3_{ts}", 45000.0, "RBI_MANDATE_LIMIT_EXCEEDED", "Invoice ₹45,000 exceeds mandate limit", "man_upi_icici_112")
    else:
        print("Invalid option selected.")

if __name__ == "__main__":
    main()
