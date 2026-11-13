import express from 'express';
import {
  initiateGitHubOAuth,
  handleGitHubCallback,
  getCurrentUser,
  logout,
} from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/github', initiateGitHubOAuth);
router.get('/github/callback', handleGitHubCallback);
router.get('/me', requireAuth, getCurrentUser);
router.post('/logout', requireAuth, logout);

export default router;

