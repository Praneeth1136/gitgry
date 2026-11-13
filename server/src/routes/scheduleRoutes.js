import express from 'express';
import {
  getSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
} from '../controllers/scheduleController.js';
import { requireAuth } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import { scheduleSchema } from '../../../shared/schemas/index.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', getSchedules);
router.post('/', validateRequest(scheduleSchema), createSchedule);
router.patch('/:id', updateSchedule);
router.delete('/:id', deleteSchedule);

export default router;

