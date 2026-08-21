import { z } from 'zod';
import dotenv from 'dotenv';
dotenv.config();

export const ClassifiedCategorySchema = z.enum([
  'ISSUER_TIMEOUT',
  'MANDATE_EXPIRED',
  'INSUFFICIENT_FUNDS',
  'LIMIT_EXCEEDED',
  'AUTHENTICATION_FAILED',
  'UNKNOWN'
]);

export type ClassifiedCategory = z.infer<typeof ClassifiedCategorySchema>;

export interface ClassificationResult {
  category: ClassifiedCategory;
  isTransient: boolean;
  recommendedRail: 'BACKGROUND_RETRY' | 'UPI_AUTOPAY_MIGRATION' | 'HITL_REVIEW';
  explanation: string;
  classificationMethod: 'DETERMINISTIC_RULES' | 'LLM_SEMANTIC_PARSER';
  confidenceScore: number;
}

const KNOWN_DETERMINISTIC_MAP: Record<string, { category: ClassifiedCategory; isTransient: boolean; recommendedRail: ClassificationResult['recommendedRail']; explanation: string }> = {
  'GATEWAY_TIMED_OUT': {
    category: 'ISSUER_TIMEOUT',
    isTransient: true,
    recommendedRail: 'BACKGROUND_RETRY',
    explanation: 'Issuing bank gateway response timed out. Retrying during low-traffic window will likely succeed.'
  },
  'BAD_REQUEST_PAYMENT_TIMED_OUT': {
    category: 'ISSUER_TIMEOUT',
    isTransient: true,
    recommendedRail: 'BACKGROUND_RETRY',
    explanation: 'Payment request timed out at NPCI switch. Telemetry retry recommended.'
  },
  'TOKEN_REVOKED_OR_EXPIRED': {
    category: 'MANDATE_EXPIRED',
    isTransient: false,
    recommendedRail: 'UPI_AUTOPAY_MIGRATION',
    explanation: 'e-Mandate token expired or deleted by user. Auto-switch to UPI AutoPay mandate required.'
  },
  'RBI_MANDATE_LIMIT_EXCEEDED': {
    category: 'LIMIT_EXCEEDED',
    isTransient: false,
    recommendedRail: 'UPI_AUTOPAY_MIGRATION',
    explanation: 'Debit amount exceeds registered mandate limit per RBI e-mandate guidelines.'
  },
  'CUSTOMER_INSUFFICIENT_FUNDS': {
    category: 'INSUFFICIENT_FUNDS',
    isTransient: true,
    recommendedRail: 'BACKGROUND_RETRY',
    explanation: 'Insufficient account balance. Retry post salary cycle or trigger customer notification.'
  },
  'TWO_FACTOR_AUTH_FAILED': {
    category: 'AUTHENTICATION_FAILED',
    isTransient: false,
    recommendedRail: 'UPI_AUTOPAY_MIGRATION',
    explanation: 'Pre-debit notification step-up authentication failed.'
  }
};

export class HybridFailureClassifier {
  /**
   * Classifies a bank failure given error code and raw error description text.
   * Uses Deterministic Rule Engine first, calls Google Gemini 2.5 Flash API for unmapped raw strings.
   */
  public async classify(rawErrorCode: string, rawErrorDescription: string): Promise<ClassificationResult> {
    const cleanCode = (rawErrorCode || '').trim().toUpperCase();

    // 1. Check Deterministic Rule Lookup
    if (KNOWN_DETERMINISTIC_MAP[cleanCode]) {
      const match = KNOWN_DETERMINISTIC_MAP[cleanCode];
      return {
        ...match,
        classificationMethod: 'DETERMINISTIC_RULES',
        confidenceScore: 1.0,
      };
    }

    // 2. Call Google Gemini 2.5 Flash AI API
    try {
      const geminiResult = await this.callGeminiAPI(rawErrorCode, rawErrorDescription);
      if (geminiResult) {
        return geminiResult;
      }
    } catch (err) {
      console.warn('Gemini API call failed, falling back to offline semantic parser:', err);
    }

    // 3. Fallback to Offline Semantic Parser
    return this.parseSemanticRawError(rawErrorCode, rawErrorDescription);
  }

  private async callGeminiAPI(rawErrorCode: string, text: string): Promise<ClassificationResult | null> {
    const apiKey = process.env.GEMINI_API_KEY || '';
    if (!apiKey) return null;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const prompt = `You are an expert Indian banking failure classifier for Razorpay e-mandate and UPI AutoPay recurring payment drop-offs.
Parse the following unstructured bank error details:
Error Code: "${rawErrorCode}"
Description: "${text}"

Classify into one of these exact categories:
- "ISSUER_TIMEOUT" (network timeouts, 504 gateway error, NPCI switch down)
- "MANDATE_EXPIRED" (token revoked, card expired, deleted token)
- "LIMIT_EXCEEDED" (amount > RBI mandate limit)
- "INSUFFICIENT_FUNDS" (low balance)
- "AUTHENTICATION_FAILED" (OTP/2FA failed)
- "UNKNOWN" (unrecognized)

Return ONLY a JSON object string without markdown wrapper matching this structure:
{
  "category": "ISSUER_TIMEOUT" | "MANDATE_EXPIRED" | "LIMIT_EXCEEDED" | "INSUFFICIENT_FUNDS" | "AUTHENTICATION_FAILED" | "UNKNOWN",
  "isTransient": boolean,
  "recommendedRail": "BACKGROUND_RETRY" | "UPI_AUTOPAY_MIGRATION" | "HITL_REVIEW",
  "explanation": "1-sentence concise explanation",
  "confidenceScore": 0.98
}`;

    const body = {
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 0.1
      }
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      console.warn(`Gemini API returned status ${res.status}`);
      return null;
    }

    const data = await res.json();
    let candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) return null;

    // Clean markdown wrappers if present
    candidateText = candidateText.replace(/```json/g, '').replace(/```/g, '').trim();

    const parsed = JSON.parse(candidateText);
    return {
      category: parsed.category || 'UNKNOWN',
      isTransient: !!parsed.isTransient,
      recommendedRail: parsed.recommendedRail || 'HITL_REVIEW',
      explanation: `[Gemini 2.5 Flash AI] ${parsed.explanation}`,
      classificationMethod: 'LLM_SEMANTIC_PARSER',
      confidenceScore: parsed.confidenceScore || 0.98,
    };
  }

  private parseSemanticRawError(rawErrorCode: string, text: string): ClassificationResult {
    const lower = `${rawErrorCode} ${text}`.toLowerCase();

    if (lower.includes('timeout') || lower.includes('504') || lower.includes('no response') || lower.includes('npci_down') || lower.includes('switch_unreachable')) {
      return {
        category: 'ISSUER_TIMEOUT',
        isTransient: true,
        recommendedRail: 'BACKGROUND_RETRY',
        explanation: 'Semantic Parser identified issuer network timeout or NPCI switch unreachable error.',
        classificationMethod: 'LLM_SEMANTIC_PARSER',
        confidenceScore: 0.94,
      };
    }

    if (lower.includes('expired') || lower.includes('revoked') || lower.includes('token_deleted') || lower.includes('invalid_mandate') || lower.includes('card_expired')) {
      return {
        category: 'MANDATE_EXPIRED',
        isTransient: false,
        recommendedRail: 'UPI_AUTOPAY_MIGRATION',
        explanation: 'Semantic Parser identified expired/revoked debit token. Initiating rail migration.',
        classificationMethod: 'LLM_SEMANTIC_PARSER',
        confidenceScore: 0.96,
      };
    }

    if (lower.includes('limit') || lower.includes('exceeded') || lower.includes('rbi_cap') || lower.includes('max_amount_surpassed')) {
      return {
        category: 'LIMIT_EXCEEDED',
        isTransient: false,
        recommendedRail: 'UPI_AUTOPAY_MIGRATION',
        explanation: 'Semantic Parser identified maximum mandate debit limit violation under RBI regulations.',
        classificationMethod: 'LLM_SEMANTIC_PARSER',
        confidenceScore: 0.92,
      };
    }

    if (lower.includes('balance') || lower.includes('insufficient') || lower.includes('low_funds') || lower.includes('debit_declined_nsf')) {
      return {
        category: 'INSUFFICIENT_FUNDS',
        isTransient: true,
        recommendedRail: 'BACKGROUND_RETRY',
        explanation: 'Semantic Parser identified insufficient funds decline.',
        classificationMethod: 'LLM_SEMANTIC_PARSER',
        confidenceScore: 0.90,
      };
    }

    if (lower.includes('otp') || lower.includes('auth') || lower.includes('pin') || lower.includes('consent_denied')) {
      return {
        category: 'AUTHENTICATION_FAILED',
        isTransient: false,
        recommendedRail: 'UPI_AUTOPAY_MIGRATION',
        explanation: 'Semantic Parser identified authentication or pre-debit consent failure.',
        classificationMethod: 'LLM_SEMANTIC_PARSER',
        confidenceScore: 0.88,
      };
    }

    return {
      category: 'UNKNOWN',
      isTransient: false,
      recommendedRail: 'HITL_REVIEW',
      explanation: 'Unrecognized error signature. Escalating for Human-In-The-Loop merchant review.',
      classificationMethod: 'LLM_SEMANTIC_PARSER',
      confidenceScore: 0.60,
    };
  }
}

export const failureClassifier = new HybridFailureClassifier();
