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
