import { Case } from '../models/Case.js';
import { Investigation } from '../models/Investigation.js';
import { AppError } from '../middleware/errorHandler.js';
import { calculateScore } from './scoring.service.js';

const ATTEMPTS_BY_DIFFICULTY = {
  easy: 3,
  medium: 2,
  hard: 1,
};

export async function processAccusation({ investigationId, playerId, suspectId, theory = '' }) {
  const investigation = await Investigation.findOne({
    _id: investigationId,
    playerId,
  });

  if (!investigation) {
    throw new AppError('Investigation not found', 404, 'NOT_FOUND');
  }

  if (investigation.status !== 'active') {
    throw new AppError('This investigation is already closed', 409, 'INVESTIGATION_CLOSED');
  }

  // Load case WITH solution (explicitly select solution per Section 11.1)
  const caseDoc = await Case.findById(investigation.caseId).select('+solution');
  if (!caseDoc) {
    throw new AppError('Associated case not found', 404, 'NOT_FOUND');
  }

  const validSuspect = caseDoc.suspects.find((s) => s.suspectId === suspectId);
  if (!validSuspect) {
    throw new AppError('Invalid suspect ID', 400, 'VALIDATION_ERROR');
  }

  const sanitizedTheory = theory.slice(0, 1000);
  const maxAttempts = ATTEMPTS_BY_DIFFICULTY[caseDoc.difficulty] || 2;

  // Check previous accusations to see if this suspect was already wrongly accused
  const previousSameWrongAccusation = investigation.accusations.some(
    (a) => a.suspectId === suspectId && !a.correct
  );

  const isCorrect = suspectId === caseDoc.solution.culpritId;

  // Record accusation
  investigation.accusations.push({
    suspectId,
    theory: sanitizedTheory,
    correct: isCorrect,
    at: new Date(),
  });

  // Calculate unique wrong attempts
  const uniqueWrongSuspects = new Set(
    investigation.accusations.filter((a) => !a.correct).map((a) => a.suspectId)
  );
  const attemptsUsed = uniqueWrongSuspects.size;
  const attemptsRemaining = Math.max(0, maxAttempts - attemptsUsed);

  if (isCorrect) {
    investigation.status = 'solved';
    investigation.endedAt = new Date();

    const scoreResult = calculateScore({
      isCorrect: true,
      wrongAttempts: attemptsUsed,
      hintsUsed: investigation.hintsUsed,
      startedAt: investigation.startedAt,
      endedAt: investigation.endedAt,
      viewedEvidenceIds: investigation.viewedEvidenceIds,
      keyEvidenceIds: caseDoc.solution.keyEvidenceIds,
      theory: sanitizedTheory,
      motive: caseDoc.solution.motive,
    });

    investigation.score = scoreResult.score;
    await investigation.save();

    return {
      correct: true,
      attemptsRemaining: 0,
      investigationStatus: 'solved',
      reveal: buildRevealPayload(caseDoc, scoreResult),
    };
  }

  // If wrong and attempts exhausted
  if (attemptsRemaining === 0) {
    investigation.status = 'failed';
    investigation.endedAt = new Date();

    const scoreResult = calculateScore({
      isCorrect: false,
    });

    investigation.score = 0;
    await investigation.save();

    return {
      correct: false,
      attemptsRemaining: 0,
      investigationStatus: 'failed',
      reveal: buildRevealPayload(caseDoc, scoreResult),
    };
  }

  // If wrong but attempts still remain: NO REVEAL and NO SPOILERS
  await investigation.save();
  return {
    correct: false,
    attemptsRemaining,
    investigationStatus: 'active',
  };
}

export function buildRevealPayload(caseDoc, scoreResult) {
  const solution = caseDoc.solution;
  return {
    culpritId: solution.culpritId,
    culpritName: caseDoc.suspects.find((s) => s.suspectId === solution.culpritId)?.name || 'Culprit',
    motive: solution.motive,
    method: solution.method,
    opportunity: solution.opportunity,
    timeline: solution.timeline,
    keyEvidence: (solution.keyEvidenceIds || []).map((id) => {
      const ev = caseDoc.evidence.find((e) => e.evidenceId === id);
      return {
        evidenceId: id,
        title: ev?.title || 'Key Clue',
        why: ev?.description || 'Crucial link in the deductive chain',
      };
    }),
    redHerrings: (solution.redHerringExplanations || []).map((rh) => ({
      evidenceId: rh.evidenceId,
      explanation: rh.explanation,
    })),
    fullExplanation: solution.fullExplanation,
    score: scoreResult?.score ?? 0,
    rank: scoreResult?.rank ?? 'Rookie',
    scoreBreakdown: scoreResult?.breakdown ?? {},
  };
}

