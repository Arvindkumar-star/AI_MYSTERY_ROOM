import { Router } from 'express';
import { z } from 'zod';
import { Investigation } from '../models/Investigation.js';
import { Case } from '../models/Case.js';
import { AppError } from '../middleware/errorHandler.js';
import { processAccusation, buildRevealPayload } from '../services/accusation.service.js';
import { calculateScore } from '../services/scoring.service.js';

const router = Router();

// POST /cases/:id/investigations - Start an investigation
router.post('/cases/:id/investigations', async (req, res, next) => {
  try {
    const caseDoc = await Case.findOne({
      _id: req.params.id,
      playerId: req.playerId,
    });

    if (!caseDoc) {
      throw new AppError('Case not found', 404, 'NOT_FOUND');
    }

    if (caseDoc.status !== 'ready') {
      throw new AppError('Case is not ready for investigation', 400, 'VALIDATION_ERROR');
    }

    // Check if player already has an active investigation for this case
    let investigation = await Investigation.findOne({
      caseId: caseDoc._id,
      playerId: req.playerId,
      status: 'active',
    });

    if (!investigation) {
      investigation = await Investigation.create({
        caseId: caseDoc._id,
        playerId: req.playerId,
        status: 'active',
        startedAt: new Date(),
      });
    }

    res.json({
      ok: true,
      data: investigation,
    });
  } catch (err) {
    next(err);
  }
});

// GET /investigations/:id - Get investigation state
router.get('/investigations/:id', async (req, res, next) => {
  try {
    const investigation = await Investigation.findOne({
      _id: req.params.id,
      playerId: req.playerId,
    });

    if (!investigation) {
      throw new AppError('Investigation not found', 404, 'NOT_FOUND');
    }

    res.json({
      ok: true,
      data: investigation,
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /investigations/:id - Update notes, board, viewed, pinned
const updateInvestigationSchema = z.object({
  notes: z.string().optional(),
  viewedEvidenceIds: z.array(z.string()).optional(),
  pinnedEvidenceIds: z.array(z.string()).optional(),
  boardLinks: z
    .array(
      z.object({
        evidenceId: z.string(),
        suspectId: z.string(),
        note: z.string().nullable().optional(),
      })
    )
    .optional(),
});

router.patch('/investigations/:id', async (req, res, next) => {
  try {
    const parseResult = updateInvestigationSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new AppError('Invalid payload', 400, 'VALIDATION_ERROR');
    }

    const updates = parseResult.data;
    const investigation = await Investigation.findOne({
      _id: req.params.id,
      playerId: req.playerId,
    });

    if (!investigation) {
      throw new AppError('Investigation not found', 404, 'NOT_FOUND');
    }

    if (updates.notes !== undefined) investigation.notes = updates.notes;
    if (updates.viewedEvidenceIds) {
      // Merge unique viewed evidence IDs
      investigation.viewedEvidenceIds = Array.from(
        new Set([...investigation.viewedEvidenceIds, ...updates.viewedEvidenceIds])
      );
    }
    if (updates.pinnedEvidenceIds !== undefined) {
      investigation.pinnedEvidenceIds = updates.pinnedEvidenceIds;
    }
    if (updates.boardLinks !== undefined) {
      investigation.boardLinks = updates.boardLinks;
    }

    await investigation.save();

    res.json({
      ok: true,
      data: investigation,
    });
  } catch (err) {
    next(err);
  }
});

// POST /investigations/:id/hint - Request a hint (P1)
router.post('/investigations/:id/hint', async (req, res, next) => {
  try {
    const investigation = await Investigation.findOne({
      _id: req.params.id,
      playerId: req.playerId,
    });

    if (!investigation) {
      throw new AppError('Investigation not found', 404, 'NOT_FOUND');
    }

    if (investigation.status !== 'active') {
      throw new AppError('Investigation is closed', 400, 'INVESTIGATION_CLOSED');
    }

    // Limit hints (max 3, or difficulty-based per Section 3)
    const caseDoc = await Case.findById(investigation.caseId);
    const maxHints = caseDoc?.difficulty === 'hard' ? 2 : 3;

    if (investigation.hintsUsed >= maxHints) {
      throw new AppError(
        `Hint limit reached (${maxHints} hints max for ${caseDoc?.difficulty || 'this'} difficulty)`,
        400,
        'HINT_LIMIT_REACHED'
      );
    }

    // Lazy load hint service or provide heuristic nudge
    let hintText = 'Examine the timeline of statements closely against physical receipts.';
    try {
      const hintService = await import('../services/gemini/prompts/hint.js');
      if (typeof hintService.generateHint === 'function') {
        hintText = await hintService.generateHint(caseDoc, investigation);
      }
    } catch {
      // Fallback nudge
    }

    investigation.hintsUsed += 1;
    investigation.hintLog.push({ text: hintText, at: new Date() });
    await investigation.save();

    res.json({
      ok: true,
      data: {
        hint: hintText,
        hintsUsed: investigation.hintsUsed,
        hintsRemaining: maxHints - investigation.hintsUsed,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /investigations/:id/accuse
const accuseSchema = z.object({
  suspectId: z.string(),
  theory: z.string().max(1000).optional().default(''),
});

router.post('/investigations/:id/accuse', async (req, res, next) => {
  try {
    const parseResult = accuseSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new AppError('Invalid accusation submission', 400, 'VALIDATION_ERROR');
    }

    const { suspectId, theory } = parseResult.data;
    const result = await processAccusation({
      investigationId: req.params.id,
      playerId: req.playerId,
      suspectId,
      theory,
    });

    res.json({
      ok: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

// GET /investigations/:id/reveal - Only accessible if resolved
router.get('/investigations/:id/reveal', async (req, res, next) => {
  try {
    const investigation = await Investigation.findOne({
      _id: req.params.id,
      playerId: req.playerId,
    });

    if (!investigation) {
      throw new AppError('Investigation not found', 404, 'NOT_FOUND');
    }

    if (investigation.status !== 'solved' && investigation.status !== 'failed') {
      throw new AppError(
        'Case solution is sealed until investigation is concluded',
        403,
        'FORBIDDEN'
      );
    }

    const caseDoc = await Case.findById(investigation.caseId).select('+solution');
    if (!caseDoc) {
      throw new AppError('Case not found', 404, 'NOT_FOUND');
    }

    const scoreResult = calculateScore({
      isCorrect: investigation.status === 'solved',
      wrongAttempts: investigation.accusations.filter((a) => !a.correct).length,
      hintsUsed: investigation.hintsUsed,
      startedAt: investigation.startedAt,
      endedAt: investigation.endedAt,
      viewedEvidenceIds: investigation.viewedEvidenceIds,
      keyEvidenceIds: caseDoc.solution.keyEvidenceIds,
      theory: investigation.accusations[investigation.accusations.length - 1]?.theory || '',
      motive: caseDoc.solution.motive,
    });

    const reveal = buildRevealPayload(caseDoc, scoreResult);

    res.json({
      ok: true,
      data: reveal,
    });
  } catch (err) {
    next(err);
  }
});

export default router;

