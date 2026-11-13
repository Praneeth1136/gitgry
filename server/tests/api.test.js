import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';

describe('API Security and System Endpoints', () => {
  it('GET /api/health should return healthy status and timestamp', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.status).toBe('healthy');
    expect(res.body.timestamp).toBeDefined();
  });

  it('GET /api/auth/me should reject unauthenticated requests with 401', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/Authentication required/i);
  });

  it('GET /api/repositories should reject unauthenticated requests with 401', async () => {
    const res = await request(app).get('/api/repositories');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/auth/github/callback with invalid state should redirect to login with error', async () => {
    const res = await request(app)
      .get('/api/auth/github/callback')
      .query({ code: 'fake_code', state: 'invalid_unrecognized_state' });

    expect(res.status).toBe(302);
    expect(res.headers.location).toMatch(/login\?error=/);
  });
});

