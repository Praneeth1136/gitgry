import express from 'express';
import {
  getManagedRepositories,
  getAvailableRepositories,
  addRepository,
  getRepositoryById,
  updateRepository,
  removeRepository,
  analyzeRepositoryEndpoint,
} from '../controllers/repositoryController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', getManagedRepositories);
router.get('/available', getAvailableRepositories);
router.post('/', addRepository);
router.get('/:id', getRepositoryById);
router.patch('/:id', updateRepository);
router.delete('/:id', removeRepository);
router.post('/:id/analyze', analyzeRepositoryEndpoint);

export default router;

