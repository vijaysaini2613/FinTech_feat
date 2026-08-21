-- 1. Merchant Configuration & Policy Rules
CREATE TABLE IF NOT EXISTS merchant_policies (
    merchant_id VARCHAR(64) PRIMARY KEY,
    hitl_threshold_amount NUMERIC(12, 2) DEFAULT 25000.00,
    max_automated_retries INT DEFAULT 2,
    retry_cooldown_hours INT DEFAULT 6,
    auto_switch_to_upi BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Mandate & Subscription Records
CREATE TABLE IF NOT EXISTS payment_mandates (
    mandate_id VARCHAR(64) PRIMARY KEY, -- Maps to Razorpay mandate/token ID
    merchant_id VARCHAR(64) REFERENCES merchant_policies(merchant_id),
    customer_id VARCHAR(64) NOT NULL,
    customer_email VARCHAR(255),
    customer_phone VARCHAR(20),
    payment_rail VARCHAR(32) NOT NULL, -- 'CARD_MANDATE', 'UPI_AUTOPAY', 'NETBANKING'
    bank_bin VARCHAR(16),
    status VARCHAR(32) NOT NULL, -- 'ACTIVE', 'REVOKED', 'EXPIRED', 'FAILED'
    max_debit_limit NUMERIC(12, 2) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Ingested Failure Webhooks (Idempotent Raw Ingestion)
CREATE TABLE IF NOT EXISTS failure_events (
    event_id VARCHAR(64) PRIMARY KEY, -- Razorpay Event ID (e.g., 'event_xyz123')
    merchant_id VARCHAR(64) REFERENCES merchant_policies(merchant_id),
    mandate_id VARCHAR(64) REFERENCES payment_mandates(mandate_id),
    invoice_id VARCHAR(64) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    raw_error_code VARCHAR(128),
    raw_error_description TEXT,
    classified_category VARCHAR(64), -- 'ISSUER_TIMEOUT', 'MANDATE_EXPIRED', 'INSUFFICIENT_FUNDS', 'LIMIT_EXCEEDED'
    ingested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Recovery Execution & Finite State Machine State
CREATE TABLE IF NOT EXISTS recovery_tasks (
    task_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id VARCHAR(64) UNIQUE REFERENCES failure_events(event_id),
    merchant_id VARCHAR(64) REFERENCES merchant_policies(merchant_id),
    mandate_id VARCHAR(64) REFERENCES payment_mandates(mandate_id),
    current_state VARCHAR(32) NOT NULL, -- 'DETECTED', 'DIAGNOSING', 'SCHEDULED_RETRY', 'AWAITING_UPI_AUTH', 'ESCALATED_HITL', 'RESOLVED', 'EXHAUSTED'
    retry_count INT DEFAULT 0,
    next_action_at TIMESTAMP WITH TIME ZONE,
    allocated_rail VARCHAR(32), -- 'BACKGROUND_RETRY', 'UPI_AUTOPAY_MIGRATION'
    recovery_payment_link TEXT,
    recovered_amount NUMERIC(12, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Append-Only Audit Ledger
CREATE TABLE IF NOT EXISTS recovery_audit_ledger (
    entry_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES recovery_tasks(task_id),
    actor VARCHAR(32) NOT NULL, -- 'SYSTEM_DAEMON', 'LLM_CLASSIFIER', 'MERCHANT_ADMIN', 'CUSTOMER'
    previous_state VARCHAR(32),
    new_state VARCHAR(32) NOT NULL,
    action_type VARCHAR(64) NOT NULL, -- 'TELEMETRY_SCHEDULE', 'PROVISION_UPI_MANDATE', 'HITL_OVERRIDE'
    metadata JSONB DEFAULT '{}'::jsonb,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
