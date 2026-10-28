import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { connectDB, disconnectDB } from '../src/db/connect.js';
import { Case } from '../src/models/Case.js';
import { Investigation } from '../src/models/Investigation.js';
import { Player } from '../src/models/Player.js';
import { fixtureCaseData } from './fixtures/sampleCase.js';

describe('Milestones 5 & 7: Gameplay, Accusation, Scoring, and Hints', () => {
  let app;
  let testPlayer;
  let playerCookie;
  let testCase;
  let investigation;

  beforeAll(async () => {
    await connectDB();
    const created = createApp();
    app = created.app;

    testPlayer = await Player.create({ anonId: 'test-anon-player-m5-m7' });
    playerCookie = `ai_mystery_player=${testPlayer.anonId}`;

    testCase = await Case.create({
      ...fixtureCaseData,
      playerId: testPlayer._id,
    });
  }, 30000);

  afterAll(async () => {
    await disconnectDB();
  });

  it('Starts an active investigation', async () => {
    const res = await request(app)
      .post(`/api/cases/${testCase._id}/investigations`)
      .set('Cookie', [playerCookie]);

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.data.status).toBe('active');
    investigation = res.body.data;
  });

  it('Autosaves notebook and clue pinning via PATCH', async () => {
    const res = await request(app)
      .patch(`/api/investigations/${investigation._id}`)
      .set('Cookie', [playerCookie])
      .send({
        notes: 'Julian Vance has no verified alibi between 22:15 and midnight.',
        pinnedEvidenceIds: ['e2', 'e3'],
        boardLinks: [{ evidenceId: 'e2', suspectId: 's1', note: 'Pub tab closed early' }],
      });

    expect(res.status).toBe(200);
    expect(res.body.data.notes).toContain('Julian Vance');
    expect(res.body.data.pinnedEvidenceIds).toEqual(['e2', 'e3']);
    expect(res.body.data.boardLinks.length).toBe(1);
  });

  it('Requests a hint and ensures NO culprit name or ID is leaked', async () => {
    const res = await request(app)
      .post(`/api/investigations/${investigation._id}/hint`)
      .set('Cookie', [playerCookie]);

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    const hint = res.body.data.hint;
    expect(hint).toBeDefined();

    // Acceptance criterion: Hint NEVER contains culprit name or ID
    const culprit = fixtureCaseData.suspects.find(
      (s) => s.suspectId === fixtureCaseData.solution.culpritId
    );
    expect(hint.toLowerCase()).not.toContain(culprit.name.toLowerCase());
    expect(hint.toLowerCase()).not.toContain(culprit.suspectId.toLowerCase());
  });

  it('Wrong accusation keeps investigation active and decrements attempts', async () => {
    const res = await request(app)
      .post(`/api/investigations/${investigation._id}/accuse`)
      .set('Cookie', [playerCookie])
      .send({
        suspectId: 's3',
        theory: 'Silas was furious about the chronometer.',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.correct).toBe(false);
    expect(res.body.data.attemptsRemaining).toBe(1);
    expect(res.body.data.investigationStatus).toBe('active');
    expect(res.body.data.reveal).toBeUndefined();
  });

  it('Correct accusation solves the case and returns full reveal with score', async () => {
    const res = await request(app)
      .post(`/api/investigations/${investigation._id}/accuse`)
      .set('Cookie', [playerCookie])
      .send({
        suspectId: fixtureCaseData.solution.culpritId, // 's1' Julian Vance
        theory: 'Julian returned to the workshop with key and struck Arthur with the brass anvil.',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.correct).toBe(true);
    expect(res.body.data.investigationStatus).toBe('solved');
    expect(res.body.data.reveal).toBeDefined();

    const reveal = res.body.data.reveal;
    expect(reveal.culpritId).toBe('s1');
    expect(reveal.culpritName).toBe('Julian Vance');
    expect(reveal.motive).toBeDefined();
    expect(reveal.method).toBeDefined();
    expect(reveal.fullExplanation).toBeDefined();
    expect(reveal.score).toBeGreaterThan(0);
    expect(reveal.rank).toBeDefined();
  });

  it('Re-accusing after resolution returns 409 INVESTIGATION_CLOSED', async () => {
    const res = await request(app)
      .post(`/api/investigations/${investigation._id}/accuse`)
      .set('Cookie', [playerCookie])
      .send({
        suspectId: 's1',
      });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('INVESTIGATION_CLOSED');
  });

  it('GET /investigations/:id/reveal succeeds after resolution', async () => {
    const res = await request(app)
      .get(`/api/investigations/${investigation._id}/reveal`)
      .set('Cookie', [playerCookie]);

    expect(res.status).toBe(200);
    expect(res.body.data.culpritId).toBe('s1');
    expect(res.body.data.keyEvidence.length).toBeGreaterThan(0);
  });
});

