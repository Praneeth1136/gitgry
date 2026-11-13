import express from 'express';
import {
  getExecutions,
  getExecutionById,
  getExecutionLogs,
  syncExecution,
} from '../controllers/executionController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Webhook callback endpoint is public or protected by signature/token
router.post('/sync', syncExecution);

// Authenticated user endpoints
router.get('/', requireAuth, getExecutions);
router.get('/:id', requireAuth, getExecutionById);
router.get('/:id/logs', requireAuth, getExecutionLogs);

export default router;

