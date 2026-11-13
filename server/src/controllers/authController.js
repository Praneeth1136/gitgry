import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { config } from '../config/index.js';
import { encryptToken, generateRandomState } from '../utils/crypto.js';
import { exchangeCodeForToken, getAuthenticatedUserProfile } from '../services/githubService.js';
import { logger } from '../utils/logger.js';

// In-memory state store with 10-minute expiry for OAuth CSRF validation
const oauthStates = new Map();

/**
 * Initiates GitHub OAuth authentication.
 */
export function initiateGitHubOAuth(req, res) {
  const state = generateRandomState();
  oauthStates.set(state, Date.now() + 10 * 60 * 1000);

  // Clean old expired states
  for (const [s, exp] of oauthStates.entries()) {
    if (Date.now() > exp) oauthStates.delete(s);
  }

  const scopes = ['read:user', 'user:email', 'repo', 'workflow'].join(' ');
  const authUrl = `https://github.com/login/oauth/authorize?client_id=${config.github.clientId}&redirect_uri=${encodeURIComponent(
    config.github.callbackUrl
  )}&scope=${encodeURIComponent(scopes)}&state=${state}`;

  res.redirect(authUrl);
}

/**
 * Handles GitHub OAuth redirect callback.
 */
export async function handleGitHubCallback(req, res) {
  const { code, state, error, error_description } = req.query;

  if (error) {
    logger.error({ error, error_description }, 'GitHub OAuth error received');
    return res.redirect(`${config.clientUrl}/login?error=${encodeURIComponent(error_description || error)}`);
  }

  // Validate state
  if (!state || !oauthStates.has(state) || Date.now() > oauthStates.get(state)) {
    oauthStates.delete(state);
    return res.redirect(`${config.clientUrl}/login?error=Invalid+or+expired+OAuth+state`);
  }
  oauthStates.delete(state);

  try {
    // Exchange code for token
    const tokenData = await exchangeCodeForToken(code);
    const accessToken = tokenData.access_token;

    // Fetch user profile
    const profile = await getAuthenticatedUserProfile(accessToken);

    // Encrypt token using AES-256-GCM
    const encryptedToken = encryptToken(accessToken);

    // Upsert User
    const user = await User.findOneAndUpdate(
      { githubId: profile.id.toString() },
      {
        githubId: profile.id.toString(),
        username: profile.login,
        displayName: profile.name || profile.login,
        avatarUrl: profile.avatar_url,
        email: profile.email || '',
        accessTokenEncrypted: encryptedToken,
        lastLoginAt: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Create session JWT
    const sessionToken = jwt.sign(
      { userId: user._id, githubId: user.githubId, username: user.username },
      config.security.sessionSecret,
      { expiresIn: '7d' }
    );

    // Set secure HTTP-only cookie
    res.cookie(config.security.cookieName, sessionToken, {
      httpOnly: true,
      secure: config.env === 'production',
      sameSite: 'lax',
      maxAge: config.security.sessionDuration,
    });

    res.redirect(`${config.clientUrl}/dashboard`);
  } catch (err) {
    logger.error({ err: err.message }, 'OAuth callback handling failed');
    res.redirect(`${config.clientUrl}/login?error=${encodeURIComponent(err.message)}`);
  }
}

/**
 * Returns current authenticated user.
 */
export async function getCurrentUser(req, res) {
  res.json({
    success: true,
    data: {
      user: {
        id: req.user._id,
        githubId: req.user.githubId,
        username: req.user.username,
        displayName: req.user.displayName,
        avatarUrl: req.user.avatarUrl,
        email: req.user.email,
        createdAt: req.user.createdAt,
      },
    },
  });
}

/**
 * Clears session cookie and logs out user.
 */
export function logout(req, res) {
  res.clearCookie(config.security.cookieName);
  res.json({ success: true, message: 'Logged out successfully' });
}

