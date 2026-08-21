import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { apiRouter } from './routes/api.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// CORS setup
app.use(cors());

// Capture raw body for webhook HMAC validation
app.use(express.json({
  verify: (req: any, res, buf) => {
    req.rawBody = buf.toString();
  }
}));

app.use(express.urlencoded({ extended: true }));

// Mount API Router
app.use('/api', apiRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'UP', service: 'Autonomous Mandate Recovery Engine', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`  Autonomous Mandate Recovery Engine Server`);
  console.log(`  Track 03: Revenue Recovery`);
  console.log(`  Server listening on http://localhost:${PORT}`);
  console.log(`  Webhook Endpoint: http://localhost:${PORT}/api/v1/webhooks/razorpay`);
  console.log(`====================================================`);
});
