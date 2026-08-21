# Security-First Vibe Coding Guidelines

Every component, API, and background task in this project strictly enforces the following 12 Security Rules:

## 1. Secrets & Environment Variables
- All API keys, tokens, and database URIs live in `.env` only.
- `.env` is strictly listed in `.gitignore`.
- `.env.example` provides template variable names.
- Zero raw secret keys in client-side code.

## 2. Rate Limiting
- Apply `express-rate-limit` across all public API routes:
  - Auth/Webhook Ingestion: 20 requests / minute
  - General API: 60 requests / minute
  - LLM/AI Proxy Endpoints: 15 requests / minute
- Returns `429 Too Many Requests` with `Retry-After` header.

## 3. Input Validation & Sanitization
- Zod schemas validate ALL incoming request bodies and parameters server-side.
- Reject invalid inputs with structured `400 Bad Request` responses.
- Parameterized database operations; zero raw string concatenation in SQL queries.

## 4. Authentication & Authorization
- Verify HMAC signatures on webhooks (`X-Razorpay-Signature`).
- Role & resource ownership checks on merchant control room endpoints.

## 5. SQL & Database Security
- Row-level concurrency locking (`SELECT FOR UPDATE`).
- Parameterized store operations avoiding raw query string interpolation.

## 6. CORS Configuration
- Restrict allowed origins; avoid `*` wildcard in production environments.

## 7. HTTP Security Headers
- Use `helmet` middleware:
  - `Content-Security-Policy`
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Strict-Transport-Security` (HSTS)
  - Remove `X-Powered-By` header.

## 8. File Upload Safety
- Strict server-side MIME type validation and file size caps.

## 9. Error Handling & Logging
- Generic error messages for client responses; stack traces suppressed in production.
- Structured server-side logging.

## 10. Dependency Security
- Regular dependency audits and pinned versions.

## 11. XSS Prevention
- Zero `dangerouslySetInnerHTML` or `eval()`.
- HTML inputs sanitized.

## 12. AI / LLM Specific Rules
- Google Gemini API calls executed **server-side only**.
- Token limits and input sanitization to prevent prompt injection.
- AI decisions restricted to classification and copy generation—zero money movement authority.
