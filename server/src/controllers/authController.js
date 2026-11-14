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
  const from = req.query.from || 'web';
  const state = `${generateRandomState()}_${from}`;
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
  const clientBase = (config.clientUrl || 'http://localhost:5173').replace(/\/login\/?$/, '').replace(/\/+$/, '');

  if (error) {
    logger.error({ error, error_description }, 'GitHub OAuth error received');
    return res.redirect(`${clientBase}/login?error=${encodeURIComponent(error_description || error)}`);
  }

  // Validate state
  if (!state || !oauthStates.has(state) || Date.now() > oauthStates.get(state)) {
    oauthStates.delete(state);
    return res.redirect(`${clientBase}/login?error=Invalid+or+expired+OAuth+state`);
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

    const isCrossSite = config.clientUrl.startsWith('https://') || config.env === 'production';

    // Set secure HTTP-only cookie
    res.cookie(config.security.cookieName, sessionToken, {
      httpOnly: true,
      secure: isCrossSite,
      sameSite: isCrossSite ? 'none' : 'lax',
      maxAge: config.security.sessionDuration,
    });

    const isExtension = state && state.endsWith('_extension');
    if (isExtension) {
      return res.redirect(`${config.serverUrl}/api/auth/extension-success#token=${sessionToken}`);
    }

    res.redirect(`${clientBase}/dashboard`);
  } catch (err) {
    logger.error({ err: err.message }, 'OAuth callback handling failed');
    res.redirect(`${clientBase}/login?error=${encodeURIComponent(err.message)}`);
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

/**
 * Serves simple HTML callback page for Chrome Extension OAuth completion
 */
export function extensionSuccess(req, res) {
  res.send(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>GitGry Extension Connected</title>
  <style>
    body { background: #0d1117; color: #c9d1d9; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
    .card { background: #161b22; border: 1px solid #30363d; border-radius: 16px; padding: 36px; text-align: center; max-width: 420px; box-shadow: 0 12px 32px rgba(0,0,0,0.6); }
    h2 { margin: 16px 0 8px; color: #3fb950; font-size: 20px; }
    p { color: #8b949e; font-size: 14px; margin-bottom: 24px; line-height: 1.5; }
    .btn { background: #238636; color: #fff; border: none; padding: 10px 24px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 14px; }
    .btn:hover { background: #2ea043; }
  </style>
</head>
<body>
  <div class="card">
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#3fb950" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
    <h2>GitGry Extension Connected!</h2>
    <p>Your GitHub authentication is verified. You can close this tab and return to your Chrome Extension popup.</p>
    <button class="btn" onclick="window.close()">Close Window</button>
  </div>
  <script>
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const token = params.get('token');
    if (token) {
      localStorage.setItem('gitgry_extension_token', token);
    }
  </script>
</body>
</html>`);
}

/**
 * Connects directly using a Personal Access Token (PAT)
 */
export async function connectWithToken(req, res) {
  try {
    const { token } = req.body;
    if (!token || !token.trim()) {
      return res.status(400).json({ success: false, message: 'GitHub token is required' });
    }

    const cleanToken = token.trim();
    const profile = await getAuthenticatedUserProfile(cleanToken);
    if (!profile || !profile.id) {
      return res.status(401).json({ success: false, message: 'Invalid GitHub token' });
    }

    const encryptedToken = encryptToken(cleanToken);
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

    const sessionToken = jwt.sign(
      { userId: user._id, githubId: user.githubId, username: user.username },
      config.security.sessionSecret,
      { expiresIn: '30d' }
    );

    return res.json({
      success: true,
      token: sessionToken,
      user: {
        id: user._id,
        githubId: user.githubId,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        email: user.email,
      },
    });
  } catch (error) {
    logger.error({ err: error.message }, 'Connect with token failed');
    return res.status(401).json({ success: false, message: 'Failed to verify token: ' + error.message });
  }
}

