import express from 'express';
import {
  getConfig,
  updateConfig,
  generatePlan,
  runApprovedTasks,
  pauseAutomation,
  resumeAutomation,
} from '../controllers/automationController.js';
import { requireAuth } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import { automationConfigSchema } from '../../../shared/schemas/index.js';
import { checkAndRunSchedules } from '../services/schedulerService.js';
import { config } from '../config/index.js';

const router = express.Router();

// Public webhook endpoint for external cloud cron runners (e.g. cron-job.org / GitHub Actions)
// Supports both GET and POST, and both Header and Query param (?secret=...)
router.all('/cron-trigger', (req, res) => {
  const secret = req.headers['x-cron-secret'] || req.query.secret;
  if (!secret || secret !== config.security.cronSecret) {
    return res.status(401).json({ success: false, message: 'Invalid or missing CRON_SECRET' });
  }

  // 1. Respond IMMEDIATELY (<20ms) with 200 OK so cron-job.org succeeds without timing out
  res.json({ success: true, message: 'Triggered successfully' });

  // 2. Execute maintenance asynchronously in background on the server
  checkAndRunSchedules(true).catch(error => {
    logger.error({ err: error.message }, '[Scheduler] Error in triggered cron execution');
  });
});

router.use(requireAuth);

router.get('/config', getConfig);
router.put('/config', validateRequest(automationConfigSchema), updateConfig);
router.post('/plan', generatePlan);
router.post('/run', runApprovedTasks);
router.post('/pause', pauseAutomation);
router.post('/resume', resumeAutomation);

export default router;

