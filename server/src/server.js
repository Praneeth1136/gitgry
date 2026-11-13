import { app } from './app.js';
import { connectDB } from './config/db.js';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';
import { startScheduler, stopScheduler } from './services/schedulerService.js';

async function startServer() {
  try {
    await connectDB();
    startScheduler();

    const server = app.listen(config.port, () => {
      logger.info(`GitGry API Server running on port ${config.port} (${config.env})`);
      logger.info(`Health check: http://localhost:${config.port}/api/health`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        logger.error(`Port ${config.port} is already in use by another process.`);
        logger.info(`Free port ${config.port} or run npm run clean:port before starting.`);
      } else {
        logger.error({ err: err.message }, 'Server error');
      }
      process.exit(1);
    });

    const shutdown = async signal => {
      logger.info(`${signal} received: closing HTTP server...`);
      stopScheduler();
      server.close(() => {
        logger.info('HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    logger.error({ err: error.message }, 'Failed to start server');
    process.exit(1);
  }
}

startServer();

