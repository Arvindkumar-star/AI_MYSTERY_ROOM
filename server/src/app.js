import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from './config/env.js';
import healthRoutes from './routes/health.routes.js';
import casesRoutes from './routes/cases.routes.js';
import investigationsRoutes from './routes/investigations.routes.js';
import assetsRoutes from './routes/assets.routes.js';
import { generalLimiter } from './middleware/rateLimit.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { playerSession } from './middleware/playerSession.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDistPath = path.resolve(__dirname, '../../client/dist');

export function createApp() {
  const app = express();

  app.use(
    helmet({
      contentSecurityPolicy: false,
    })
  );
  app.use(
    cors({
      origin: env.CLIENT_ORIGIN || true,
      credentials: true,
      exposedHeaders: ['x-player-id'],
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

  // Serve client static build
  app.use(express.static(clientDistPath));

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    const indexHtml = path.join(clientDistPath, 'index.html');
    res.sendFile(indexHtml, (err) => {
      if (err) next();
    });
  });

  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return { app, apiRouter };
}
