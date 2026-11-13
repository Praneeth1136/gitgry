import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load root .env
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  serverUrl: process.env.SERVER_URL || 'http://localhost:5000',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/gitgry',

  github: {
    clientId: process.env.GITHUB_CLIENT_ID || '',
    clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
    callbackUrl: process.env.GITHUB_CALLBACK_URL || 'http://localhost:5000/api/auth/github/callback',
    automationRepo: process.env.GITHUB_AUTOMATION_REPO || '',
    automationWorkflow: process.env.GITHUB_AUTOMATION_WORKFLOW || 'repository-maintenance.yml',
    dispatchToken: process.env.GITHUB_DISPATCH_TOKEN || '',
  },

  security: {
    encryptionKey: process.env.ENCRYPTION_KEY || '3055ca5b87484f2264deb65f85307e05b8c82706a7e145b06e7fc1fe2b1a092e',
    sessionSecret: process.env.SESSION_SECRET || '30d620e7c7aee336f898fad3e1b5081bb3431f116a97071eb1ed7f72adc67f90',
    cronSecret: process.env.CRON_SECRET || 'gitgry_cron_secret_2026',
    cookieName: 'gitgry_session',
    sessionDuration: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  },
};

