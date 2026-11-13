import express from 'express';
import {
  getTasks,
  getTaskById,
  approveTask,
  rejectTask,
  executeTask,
} from '../controllers/taskController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', getTasks);
router.get('/:id', getTaskById);
router.post('/:id/approve', approveTask);
router.post('/:id/reject', rejectTask);
router.post('/:id/execute', executeTask);

export default router;

