import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { connectDB, disconnectDB } from '../src/db/connect.js';
import { Case } from '../src/models/Case.js';
import { Investigation } from '../src/models/Investigation.js';
import { Player } from '../src/models/Player.js';
import { fixtureCaseData } from './fixtures/sampleCase.js';

describe('Milestone 2: Anti-Spoiler Invariants and CRUD Test', () => {
  let app;
  let playerCookie;
  let testPlayer;
  let testCase;
  let testInvestigation;

  beforeAll(async () => {
    await connectDB();
    const created = createApp();
    app = created.app;

    // Create a player and case fixture
    testPlayer = await Player.create({ anonId: 'test-anon-player-m2' });
    playerCookie = `ai_mystery_player=${testPlayer.anonId}`;

    testCase = await Case.create({
      ...fixtureCaseData,
      playerId: testPlayer._id,
    });
  }, 30000);

  afterAll(async () => {
    await disconnectDB();
  });

  it('GET /api/cases/:id returns sanitized case without any spoiler fields', async () => {
    const res = await request(app)
      .get(`/api/cases/${testCase._id}`)
      .set('Cookie', [playerCookie]);

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    const caseData = res.body.data;

    // Check that core info is present
    expect(caseData.title).toBe(fixtureCaseData.title);
    expect(caseData.suspects.length).toBe(fixtureCaseData.suspects.length);
    expect(caseData.evidence.length).toBe(fixtureCaseData.evidence.length);

    // ANTI-SPOILER ASSERTIONS:
    // 1. Never include solution object or culprit designation
    expect(caseData.solution).toBeUndefined();
    expect(caseData.culpritId).toBeUndefined();
    expect(JSON.stringify(caseData)).not.toContain('"culpritId"');
    expect(JSON.stringify(caseData)).not.toContain(fixtureCaseData.solution.motive);
    expect(JSON.stringify(caseData)).not.toContain(fixtureCaseData.solution.fullExplanation);

    // 2. Never include isRedHerring
    expect(JSON.stringify(caseData)).not.toContain('"isRedHerring"');

    // 3. Never include AI prompts
    expect(JSON.stringify(caseData)).not.toContain('portraitPrompt');
    expect(JSON.stringify(caseData)).not.toContain('imagePrompt');

    // 4. Never include solver verification
    expect(caseData.verification).toBeUndefined();
  });

  it('Cannot access /reveal while investigation is active', async () => {
    const invRes = await request(app)
      .post(`/api/cases/${testCase._id}/investigations`)
      .set('Cookie', [playerCookie]);

    expect(invRes.status).toBe(200);
    testInvestigation = invRes.body.data;

    const revealRes = await request(app)
      .get(`/api/investigations/${testInvestigation._id}/reveal`)
      .set('Cookie', [playerCookie]);

    expect(revealRes.status).toBe(403);
    expect(revealRes.body.ok).toBe(false);
    expect(revealRes.body.error.code).toBe('FORBIDDEN');
  });

  it('Wrong accusation with attempts remaining does NOT leak reveal or culprit', async () => {
    // Julian Vance ('s1') is the true culprit in fixture. Let's accuse Silas Thorne ('s3').
    const accuseRes = await request(app)
      .post(`/api/investigations/${testInvestigation._id}/accuse`)
      .set('Cookie', [playerCookie])
      .send({
        suspectId: 's3',
        theory: 'Silas was furious about his chronometer deposit.',
      });

    expect(accuseRes.status).toBe(200);
    expect(accuseRes.body.ok).toBe(true);
    expect(accuseRes.body.data.correct).toBe(false);
    expect(accuseRes.body.data.attemptsRemaining).toBe(1); // Medium difficulty starts with 2 attempts
    expect(accuseRes.body.data.investigationStatus).toBe('active');

    // Anti-spoiler verification:
    expect(accuseRes.body.data.reveal).toBeUndefined();
    expect(JSON.stringify(accuseRes.body)).not.toContain('"culpritId"');
    expect(JSON.stringify(accuseRes.body)).not.toContain(fixtureCaseData.solution.motive);
  });

  it('Exhausting attempts reveals full solution and marks investigation failed', async () => {
    // Accuse another wrong suspect to exhaust attempts (attemptsRemaining becomes 0)
    const secondAccuseRes = await request(app)
      .post(`/api/investigations/${testInvestigation._id}/accuse`)
      .set('Cookie', [playerCookie])
      .send({
        suspectId: 's2',
        theory: 'Clara wanted her inheritance.',
      });

    expect(secondAccuseRes.status).toBe(200);
    expect(secondAccuseRes.body.ok).toBe(true);
    expect(secondAccuseRes.body.data.correct).toBe(false);
    expect(secondAccuseRes.body.data.attemptsRemaining).toBe(0);
    expect(secondAccuseRes.body.data.investigationStatus).toBe('failed');

    // Reveal is now legitimately available
    expect(secondAccuseRes.body.data.reveal).toBeDefined();
    expect(secondAccuseRes.body.data.reveal.culpritId).toBe(fixtureCaseData.solution.culpritId);
    expect(secondAccuseRes.body.data.reveal.score).toBe(0); // Failed score is 0
  });
});
