import express from 'express';
import {
  getOverview,
  getActivity,
  getRepositoryStats,
} from '../controllers/analyticsController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);

router.get('/overview', getOverview);
router.get('/activity', getActivity);
router.get('/repositories', getRepositoryStats);

export default router;

