import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { apiRouter } from './routes/api.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Rule 7: HTTP Security Headers via Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://rzp.io"],
      connectSrc: ["'self'", "https://generativelanguage.googleapis.com"],
      frameAncestors: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  xFrameOptions: { action: 'deny' },
}));

// Rule 6: Strict CORS Configuration
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173').split(',');
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('CORS Policy: Origin not allowed by security configuration'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Razorpay-Signature', 'X-Requested-With'],
  credentials: true,
}));

// Rule 2: Rate Limiting Engine
const generalApiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'TOO_MANY_REQUESTS', message: 'Rate limit exceeded (60 req/min). Please try again shortly.' }
});

const webhookLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 webhooks per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'TOO_MANY_REQUESTS', message: 'Webhook ingestion rate limit exceeded (30 req/min).' }
});

const aiProxyLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 15, // 15 AI operations per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'TOO_MANY_REQUESTS', message: 'AI Classification rate limit exceeded (15 req/min).' }
});

// Capture raw body for byte-exact HMAC validation (Rule 1 & Rule 3)
app.use(express.json({
  limit: '2mb', // Rule 8: Size limits
  verify: (req: any, res, buf) => {
    req.rawBody = buf.toString();
  }
}));

app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Apply Rate Limits
app.use('/api/v1/webhooks', webhookLimiter);
app.use('/api/v1/simulation', aiProxyLimiter);
app.use('/api', generalApiLimiter);

// Mount API Router
app.use('/api', apiRouter);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'UP', service: 'Autonomous Mandate Recovery Engine', timestamp: new Date().toISOString() });
});

// Root Welcome & Endpoint Directory Route (Prevents "Cannot GET /" in browser)
app.get('/', (req: Request, res: Response) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Autonomous Mandate Recovery Engine | Express API Server</title>
      <style>
        body { font-family: system-ui, -apple-system, sans-serif; background: #070d19; color: #f1f5f9; padding: 2rem; line-height: 1.6; }
        .card { max-width: 640px; margin: 0 auto; background: #0f172a; border: 1px solid #1e293b; border-radius: 1rem; padding: 2rem; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
        h1 { color: #38bdf8; font-size: 1.5rem; margin-top: 0; }
        .badge { background: #0284c7; color: white; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: bold; }
        a.btn { display: inline-block; background: #2563eb; color: white; text-decoration: none; padding: 0.75rem 1.5rem; border-radius: 0.5rem; font-weight: bold; margin-top: 1rem; }
        a.btn:hover { background: #1d4ed8; }
        ul { padding-left: 1.25rem; color: #94a3b8; }
        li { margin-bottom: 0.5rem; }
        code { background: #1e293b; color: #38bdf8; padding: 0.2rem 0.4rem; border-radius: 0.25rem; font-family: monospace; }
      </style>
    </head>
    <body>
      <div class="card">
        <span class="badge">API BACKEND SERVER ONLINE</span>
        <h1>Autonomous Mandate & Involuntary Churn Healing Engine</h1>
        <p>This server hosts the Express REST API backend and Webhook ingestion gateway for Razorpay Track 03.</p>
        <a href="http://localhost:5173" class="btn">🚀 Open FinOps Control Room Dashboard (Port 5173)</a>
        <h3 style="color:#e2e8f0; margin-top:2rem;">Available API Endpoints:</h3>
        <ul>
          <li><code>GET /health</code> - Service Health Check</li>
          <li><code>POST /api/v1/webhooks/razorpay</code> - Webhook Ingestion Gateway</li>
          <li><code>GET /api/v1/dashboard/stats</code> - Real-time Recovery Metrics</li>
          <li><code>GET /api/v1/merchant/tasks</code> - FSM Task Registry</li>
          <li><code>GET /api/v1/audit-ledger</code> - Immutable Cryptographic SHA-256 Ledger</li>
        </ul>
      </div>
    </body>
    </html>
  `);
});

// Rule 9: Server-side Error Handling & Logging Middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(`[Security Log] ${new Date().toISOString()} - ${req.method} ${req.path} Error:`, err.message);
  
  const statusCode = err.status || err.statusCode || 500;
  const genericMessage = process.env.NODE_ENV === 'production' 
    ? 'An internal security exception occurred. Please try again.' 
    : err.message;

  res.status(statusCode).json({
    error: err.name || 'INTERNAL_SERVER_ERROR',
    message: genericMessage,
  });
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`  Autonomous Mandate Recovery Engine Server`);
  console.log(`  Security Profile: Security-First Vibe Coding Compliant ✅`);
  console.log(`  Server listening on http://localhost:${PORT}`);
  console.log(`  Webhook Endpoint: http://localhost:${PORT}/api/v1/webhooks/razorpay`);
  console.log(`====================================================`);
});
