import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { connectDB, disconnectDB } from '../src/db/connect.js';

describe('Milestone 1: Health & Player Session', () => {
  let app;

  beforeAll(async () => {
    await connectDB();
    const created = createApp();
    app = created.app;
  });

  afterAll(async () => {
    await disconnectDB();
  });

  it('GET /api/health returns 200 with database connected', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.data.database).toBe('connected');
    expect(res.body.data.status).toBe('healthy');
  });

  it('Issues an httpOnly player session cookie on first request', async () => {
    const res = await request(app).get('/api/health');
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    const playerCookie = cookies.find((c) => c.startsWith('ai_mystery_player='));
    expect(playerCookie).toBeDefined();
    expect(playerCookie).toContain('HttpOnly');
  });
});

