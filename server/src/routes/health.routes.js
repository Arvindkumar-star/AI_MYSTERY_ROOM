import { Router } from 'express';
import mongoose from 'mongoose';
import { env } from '../config/env.js';

const router = Router();

router.get('/health', async (req, res) => {
  const dbState = mongoose.connection.readyState;
  const isDbConnected = dbState === 1;

  res.status(isDbConnected ? 200 : 503).json({
    ok: isDbConnected,
    data: {
      status: isDbConnected ? 'healthy' : 'degraded',
      database: isDbConnected ? 'connected' : 'disconnected',
      hasGroqKey: Boolean(env.GROQ_API_KEY && env.GROQ_API_KEY.trim()),
      groqModel: env.GROQ_TEXT_MODEL,
      hasGeminiKey: Boolean(env.GEMINI_API_KEY && env.GEMINI_API_KEY.trim()),
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    },
  });
});

export default router;

