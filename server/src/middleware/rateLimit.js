import rateLimit from 'express-rate-limit';

// POST /cases: 5 per hour per player, 20 per hour per IP (Section 14.2)
export const caseCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    ok: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many case generation requests. Please try again in an hour.',
    },
  },
});

// POST /investigations/:id/hint: 10 per hour per player
export const hintLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    ok: false,
    error: {
      code: 'HINT_LIMIT_REACHED',
      message: 'Hint request quota exceeded for this hour.',
    },
  },
});

// General API: 300 per 15 minutes
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    ok: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many requests. Please slow down.',
    },
  },
});

