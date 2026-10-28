import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import { env } from './config/env.js';
import healthRoutes from './routes/health.routes.js';
import casesRoutes from './routes/cases.routes.js';
import investigationsRoutes from './routes/investigations.routes.js';
import assetsRoutes from './routes/assets.routes.js';
import { generalLimiter } from './middleware/rateLimit.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { playerSession } from './middleware/playerSession.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.CLIENT_ORIGIN,
      credentials: true,
    })
  );

  app.use(cookieParser(env.COOKIE_SECRET));
  app.use(express.json({ limit: '50kb' }));
  app.use(mongoSanitize());

  if (env.NODE_ENV !== 'test') {
    app.use('/api', generalLimiter);
  }

  // Mount API router
  const apiRouter = express.Router();
  apiRouter.use(playerSession);
  apiRouter.use(healthRoutes);
  apiRouter.use(casesRoutes);
  apiRouter.use(investigationsRoutes);
  apiRouter.use(assetsRoutes);

  app.use('/api', apiRouter);

  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return { app, apiRouter };
}
