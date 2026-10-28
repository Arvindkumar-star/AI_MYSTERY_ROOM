import { createApp } from './app.js';
import { connectDB } from './db/connect.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { Case } from './models/Case.js';

async function bootstrap() {
  try {
    await connectDB();

    // Mark cases stuck in generating for > 10 mins as failed (Section 15)
    try {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      const result = await Case.updateMany(
        {
          status: 'generating',
          updatedAt: { $lt: tenMinutesAgo },
        },
        {
          $set: {
            status: 'failed',
            generationError: 'Server restarted while case was generating. Please retry.',
          },
        }
      );
      if (result.modifiedCount > 0) {
        logger.info(`Cleaned up ${result.modifiedCount} stale generating case(s).`);
      }
    } catch (err) {
      // Ignore if Case model is not ready during initial setup
      logger.debug(`Case cleanup skipped: ${err.message}`);
    }

    const { app } = createApp();

    const server = app.listen(env.PORT, () => {
      logger.info(`Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
    });

    const shutdown = () => {
      logger.info('Shutting down server gracefully...');
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (err) {
    logger.error(`Bootstrap failed: ${err.message}`);
    process.exit(1);
  }
}

bootstrap();

