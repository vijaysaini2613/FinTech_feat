import { db, BankTelemetry } from '../db/store.js';

export const MOCK_BANK_HEALTH: Record<string, { uptime_score: number; status: 'HEALTHY' | 'DEGRADED' | 'OUTAGE'; recommended_delay_hours: number }> = {
  "HDFC": { uptime_score: 0.45, status: "DEGRADED", recommended_delay_hours: 3 },
  "SBIN": { uptime_score: 0.20, status: "OUTAGE", recommended_delay_hours: 6 },
  "ICIC": { uptime_score: 0.98, status: "HEALTHY", recommended_delay_hours: 0 },
  "UTIB": { uptime_score: 0.95, status: "HEALTHY", recommended_delay_hours: 0 },
};

export class TelemetryEngine {
  /**
   * Deterministic Telemetry Helper using bank BIN or IFSC prefix.
   */
  public getBankHealthByCode(binOrIfsc: string): { uptime_score: number; status: 'HEALTHY' | 'DEGRADED' | 'OUTAGE'; recommended_delay_hours: number } {
    const bankCode = (binOrIfsc || '').substring(0, 4).toUpperCase();
    return MOCK_BANK_HEALTH[bankCode] || { uptime_score: 0.90, status: 'HEALTHY', recommended_delay_hours: 0 };
  }

  /**
   * Checks if an issuing bank is experiencing an outage or degraded state.
   */
  public checkBankHealth(bankCode: string): { isHealthy: boolean; telemetry: BankTelemetry; recommendedDelayHours: number } {
    const helperMatch = this.getBankHealthByCode(bankCode);
    const allTelemetry = db.getBankTelemetry();
    const telemetry = allTelemetry[bankCode] || {
      bank_code: bankCode,
      bank_name: `${bankCode} Bank`,
      clearing_rate_pct: helperMatch.uptime_score * 100,
      status: helperMatch.status,
      active_circuit_breaker: helperMatch.status !== 'HEALTHY',
      last_updated: new Date().toISOString(),
    };

    if (telemetry.active_circuit_breaker || telemetry.status === 'OUTAGE' || telemetry.clearing_rate_pct < 50.0) {
      return {
        isHealthy: false,
        telemetry,
        recommendedDelayHours: helperMatch.recommended_delay_hours || 6,
      };
    }

    if (telemetry.status === 'DEGRADED' || telemetry.clearing_rate_pct < 85.0) {
      return {
        isHealthy: false,
        telemetry,
        recommendedDelayHours: helperMatch.recommended_delay_hours || 3,
      };
    }

    return {
      isHealthy: true,
      telemetry,
      recommendedDelayHours: 0,
    };
  }

  /**
   * Enforces RBI 24-Hour Pre-Debit Compliance:
   * Verifies if Razorpay Pre-Debit Notification API was sent >= 24h prior, or enforces timestamp offset T + 24 hours.
   */
  public calculateRBICompliantRetryTime(delayHours: number, preDebitNoticeSentAt?: string | null): { retryTimestamp: string; rbiNoticeEnforced: boolean } {
    const now = new Date();
    let rbiNoticeEnforced = false;

    if (preDebitNoticeSentAt) {
      const noticeTime = new Date(preDebitNoticeSentAt).getTime();
      const elapsedHours = (now.getTime() - noticeTime) / (1000 * 60 * 60);
      if (elapsedHours < 24) {
        const remainingHours = 24 - elapsedHours;
        delayHours = Math.max(delayHours, remainingHours);
        rbiNoticeEnforced = true;
      }
    } else {
      delayHours = Math.max(delayHours, 24);
      rbiNoticeEnforced = true;
    }

    const d = new Date(now.getTime() + delayHours * 60 * 60 * 1000);
    return { retryTimestamp: d.toISOString(), rbiNoticeEnforced };
  }
}

export const telemetryEngine = new TelemetryEngine();
