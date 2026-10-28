import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

export class AppError extends Error {
  constructor(message, statusCode = 400, code = 'INTERNAL') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

export function notFoundHandler(req, res, next) {
  res.status(404).json({
    ok: false,
    error: {
      code: 'NOT_FOUND',
      message: `Cannot ${req.method} ${req.originalUrl}`,
    },
  });
}

export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || (err.name === 'ValidationError' ? 400 : 500);
  const code = err.code || (err.name === 'ValidationError' ? 'VALIDATION_ERROR' : 'INTERNAL');
  const message = err.message || 'An unexpected error occurred';

  if (statusCode >= 500) {
    logger.error({ err, path: req.path, method: req.method }, 'Server Error');
  }

  res.status(statusCode).json({
    ok: false,
    error: {
      code,
      message,
      ...(env.NODE_ENV !== 'production' && { stack: err.stack }),
    },
  });
}

