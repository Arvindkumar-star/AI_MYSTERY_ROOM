import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { connectDB, disconnectDB } from '../src/db/connect.js';
import { Case } from '../src/models/Case.js';
import { Player } from '../src/models/Player.js';

describe('Milestone 3: Gemini Generation Pipeline Test', () => {
  let app;
  let testPlayer;
  let playerCookie;

  beforeAll(async () => {
    await connectDB();
    const created = createApp();
    app = created.app;

    testPlayer = await Player.create({ anonId: 'test-anon-player-m3' });
    playerCookie = `ai_mystery_player=${testPlayer.anonId}`;
  }, 30000);

  afterAll(async () => {
    await disconnectDB();
  });

  it('Pipeline completes and yields a verified, ready case', async () => {
    // 1. Initiate case generation via POST /cases
    const postRes = await request(app)
      .post('/api/cases')
      .set('Cookie', [playerCookie])
      .send({
        premise: 'A famous opera tenor collapses on stage during the final act of Pagliacci in Venice.',
        difficulty: 'easy',
        tone: 'noir',
      });

    expect(postRes.status).toBe(202);
    expect(postRes.body.ok).toBe(true);
    const caseId = postRes.body.data.caseId;
    expect(caseId).toBeDefined();

    // 2. Poll until status is no longer 'generating'
    let statusRes;
    for (let i = 0; i < 30; i++) {
      statusRes = await request(app)
        .get(`/api/cases/${caseId}/status`)
        .set('Cookie', [playerCookie]);

      if (statusRes.body.data.status !== 'generating') {
        break;
      }
      await new Promise((r) => setTimeout(r, 200));
    }

    if (statusRes.body.data.status !== 'ready') {
      console.log('Case generation error:', statusRes.body.data.error);
    }

    expect(statusRes.status).toBe(200);
    expect(statusRes.body.data.status).toBe('ready');
    expect(statusRes.body.data.progress).toBe(100);

    // 3. Retrieve the generated case
    const caseRes = await request(app)
      .get(`/api/cases/${caseId}`)
      .set('Cookie', [playerCookie]);

    expect(caseRes.status).toBe(200);
    const caseData = caseRes.body.data;
    expect(caseData.title).toBeDefined();
    expect(caseData.suspects.length).toBeGreaterThanOrEqual(4);
    expect(caseData.evidence.length).toBeGreaterThanOrEqual(5);

    // Verify solvability recorded
    const rawCase = await Case.findById(caseId);
    expect(rawCase.verification.passed).toBe(true);
  }, 140000);
});
