import logger from './logging.js';

let sentryClient = null;

export const initSentry = (app) => {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    logger.info('Sentry DSN not found in environment. Skipping Sentry integration.');
    return;
  }

  logger.info('Initializing Sentry SDK error tracking...');
  // A mock/stub client that logs errors to the Winston logger.
  // In production, this would initialize @sentry/node.
  sentryClient = {
    captureException: (error) => {
      logger.error(`[Sentry Alert] Captured Exception: ${error.message}`, {
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
    }
  };
};

export const captureException = (error) => {
  if (sentryClient) {
    sentryClient.captureException(error);
  }
};
