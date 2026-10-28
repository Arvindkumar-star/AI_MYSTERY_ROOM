import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

let memoryServer = null;

export async function connectDB() {
  const options = {
    serverSelectionTimeoutMS: 10000,
    dbName: 'ai-mystery-room',
  };

  try {
    await mongoose.connect(env.MONGODB_URI, options);
    logger.info(`Connected to MongoDB at ${env.MONGODB_URI}`);
  } catch (err) {
    if (env.NODE_ENV !== 'production') {
      logger.warn(`Could not connect to standalone MongoDB at ${env.MONGODB_URI}. Starting in-memory MongoDB...`);
      try {
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        memoryServer = await MongoMemoryServer.create();
        const memoryUri = memoryServer.getUri();
        await mongoose.connect(memoryUri);
        logger.info(`Connected to MongoMemoryServer at ${memoryUri}`);
      } catch (memErr) {
        logger.error(`Failed to start MongoMemoryServer: ${memErr.message}`);
        throw memErr;
      }
    } else {
      logger.error(`MongoDB connection error: ${err.message}`);
      throw err;
    }
  }

  mongoose.connection.on('error', (err) => {
    logger.error(`MongoDB connection error: ${err.message}`);
  });
}

export async function disconnectDB() {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
  }
}

