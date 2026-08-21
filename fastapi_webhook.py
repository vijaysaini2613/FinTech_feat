import hmac
import hashlib
import json
import os
from typing import Optional
from fastapi import FastAPI, Request, Header, HTTPException, status, BackgroundTasks, Depends
from pydantic import BaseModel

app = FastAPI(title="RazorFinOps Webhook Ingestion Engine")

RAZORPAY_WEBHOOK_SECRET = os.getenv("RAZORPAY_WEBHOOK_SECRET", "test_webhook_secret_key")


# ---------------------------------------------------------------------------
# Idempotency & Verification Utilities
# ---------------------------------------------------------------------------

def verify_razorpay_signature(raw_body: bytes, received_signature: str, secret: str) -> bool:
    """
    Validates the raw request bytes against the X-Razorpay-Signature header 
    using HMAC-SHA256 and constant-time string comparison.
    """
    generated_signature = hmac.new(
        key=secret.encode("utf-8"),
        msg=raw_body,
        digestmod=hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(generated_signature, received_signature)


async def orchestrate_diagnosis_pipeline(event_id: str, task_id: str):
    """
    Background worker: Kicks off ML telemetry classification 
    and policy engine checks asynchronously.
    """
    # 1. Fetch failure details from DB
    # 2. Run hybrid error classification
    # 3. Transition FSM state (e.g., SCHEDULED_RETRY, AWAITING_UPI_AUTH, ESCALATED_HITL)
    pass


# ---------------------------------------------------------------------------
# Ingestion Endpoint
# ---------------------------------------------------------------------------

@app.post(
    "/api/v1/webhooks/razorpay",
    status_code=status.HTTP_200_OK,
    summary="Ingest and verify Razorpay payment/mandate failure webhooks"
)
async def handle_razorpay_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    x_razorpay_signature: Optional[str] = Header(None, alias="X-Razorpay-Signature"),
    x_razorpay_event_id: Optional[str] = Header(None, alias="X-Razorpay-Event-Id"),
):
    # 1. Signature Presence Check
    if not x_razorpay_signature:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing required header: X-Razorpay-Signature"
        )

    # 2. Read Raw Request Body for Byte-Exact HMAC Verification
    raw_body = await request.body()
    
    if not verify_razorpay_signature(raw_body, x_razorpay_signature, RAZORPAY_WEBHOOK_SECRET):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid webhook signature. Payload rejected."
        )

    # 3. Parse JSON Payload
    try:
        payload = json.loads(raw_body.decode("utf-8"))
    except UnicodeDecodeError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payload encoding must be UTF-8"
        )
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Malformed JSON payload"
        )

    event_type = payload.get("event")
    event_id = x_razorpay_event_id or payload.get("event_id") or payload.get("id")

    if not event_id:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Unable to resolve unique event identifier"
        )

    # 4. Filter for Target Recovery Events
    target_failure_events = {
        "payment.failed",
        "subscription.charged_failed",
        "subscription.halted",
        "token.rejected",
    }

    if event_type not in target_failure_events:
        # Acknowledge unhandled event types with 200 OK to prevent gateway retry storms
        return {"status": "ignored", "reason": f"Event '{event_type}' not in recovery scope"}

    # 5. Extract Normalized Failure Metadata
    payment_entity = payload.get("payload", {}).get("payment", {}).get("entity", {})
    subscription_entity = payload.get("payload", {}).get("subscription", {}).get("entity", {})

    amount_in_paise = payment_entity.get("amount") or subscription_entity.get("total_count", 0)
    amount_inr = float(amount_in_paise) / 100.0 if amount_in_paise else 0.0
    
    mandate_id = (
        payment_entity.get("token_id") 
        or payment_entity.get("mandate_id") 
        or subscription_entity.get("id")
    )
    merchant_id = payload.get("account_id") or payment_entity.get("merchant_id", "default_merchant")
    invoice_id = payment_entity.get("invoice_id") or f"inv_fallback_{event_id}"
    error_code = payment_entity.get("error_code") or "UNKNOWN_ERROR"
    error_desc = payment_entity.get("error_description") or payment_entity.get("error_reason", "")

    # Mocked Task ID for demonstration
    task_id = f"task_{event_id}"

    # 7. Offload FSM Diagnostics to Non-Blocking Worker
    background_tasks.add_task(
        orchestrate_diagnosis_pipeline,
        event_id=event_id,
        task_id=task_id
    )

    # 8. Immediate 200 OK Acknowledgment
    return {
        "status": "success",
        "event_id": event_id,
        "task_id": task_id,
        "action": "enqueued_for_diagnosis"
    }
