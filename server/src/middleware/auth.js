import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { config } from '../config/index.js';
import { decryptToken } from '../utils/crypto.js';

export async function requireAuth(req, res, next) {
  try {
    const token = req.cookies[config.security.cookieName];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required. No session found.',
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, config.security.sessionSecret);
    } catch (err) {
      res.clearCookie(config.security.cookieName);
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired session. Please log in again.',
      });
    }

    const user = await User.findById(decoded.userId).select('+accessTokenEncrypted');
    if (!user) {
      res.clearCookie(config.security.cookieName);
      return res.status(401).json({
        success: false,
        error: 'User not found. Please log in again.',
      });
    }

    // Decrypt access token for GitHub operations
    let plainAccessToken = null;
    try {
      plainAccessToken = decryptToken(user.accessTokenEncrypted);
    } catch (err) {
      // In case token decryption fails
    }

    req.user = user;
    req.githubToken = plainAccessToken;
    next();
  } catch (error) {
    next(error);
  }
}

