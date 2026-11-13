import mongoose from 'mongoose';
import { config } from './index.js';
import { logger } from '../utils/logger.js';

let isConnected = false;

export async function connectDB(retries = 5, delay = 2500) {
  if (isConnected) {
    return mongoose.connection;
  }

  for (let i = 0; i < retries; i++) {
    try {
      const conn = await mongoose.connect(config.mongodbUri, {
        serverSelectionTimeoutMS: 30000,
      });
      isConnected = true;
      logger.info(`MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
      return conn.connection;
    } catch (error) {
      logger.warn(`MongoDB connect attempt ${i + 1}/${retries} failed: ${error.message}. Retrying...`);
      if (i === retries - 1) {
        logger.error({ err: error.message }, 'MongoDB connection error after retries');
        throw error;
      }
      await new Promise(r => setTimeout(r, delay));
    }
  }
}

export async function disconnectDB() {
  if (isConnected) {
    await mongoose.disconnect();
    isConnected = false;
    logger.info('MongoDB Disconnected');
  }
}

