import { Router } from 'express';
import { z } from 'zod';
import { Case } from '../models/Case.js';
import { sanitizeCaseForClient } from '../services/caseSanitizer.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

const createCaseSchema = z.object({
  title: z.string().max(100).optional(),
  premise: z.string().min(20).max(1000),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  tone: z.enum(['classic', 'noir', 'cozy', 'thriller', 'scifi']).default('noir'),
});

// POST /cases - create case & begin generation
router.post('/cases', async (req, res, next) => {
  try {
    const parseResult = createCaseSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new AppError(
        parseResult.error.errors.map((e) => e.message).join(', '),
        400,
        'VALIDATION_ERROR'
      );
    }

    const { title, premise, difficulty, tone } = parseResult.data;

    // Check concurrent generating limit: max 2 per player (Section 14.2)
    const activeGenerating = await Case.countDocuments({
      playerId: req.playerId,
      status: 'generating',
    });
    if (activeGenerating >= 2) {
      throw new AppError(
        'You have too many cases currently generating. Please wait.',
        429,
        'RATE_LIMITED'
      );
    }

    const newCase = await Case.create({
      playerId: req.playerId,
      title: title?.trim() || 'Untitled Mystery',
      premise,
      difficulty,
      tone,
      status: 'generating',
      generationStage: 'moderate',
    });

    // Lazy load caseGenerator if available (will be connected in M3)
    import('../services/caseGenerator.js')
      .then((mod) => {
        if (typeof mod.startGenerationJob === 'function') {
          mod.startGenerationJob(newCase._id).catch(() => {});
        }
      })
      .catch(() => {});

    res.status(202).json({
      ok: true,
      data: {
        caseId: newCase._id.toString(),
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /cases/:id/status - poll generation progress
router.get('/cases/:id/status', async (req, res, next) => {
  try {
    const caseDoc = await Case.findOne({
      _id: req.params.id,
      playerId: req.playerId,
    });

    if (!caseDoc) {
      throw new AppError('Case not found', 404, 'NOT_FOUND');
    }

    const stageProgress = {
      moderate: 10,
      blueprint: 30,
      evidence: 60,
      verify: 80,
      repair: 85,
      images: 95,
      done: 100,
    };

    res.json({
      ok: true,
      data: {
        status: caseDoc.status,
        generationStage: caseDoc.generationStage,
        progress: stageProgress[caseDoc.generationStage] || (caseDoc.status === 'ready' ? 100 : 0),
        error: caseDoc.generationError,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /cases/:id - sanitized case payload
router.get('/cases/:id', async (req, res, next) => {
  try {
    const caseDoc = await Case.findOne({
      _id: req.params.id,
      playerId: req.playerId,
    });

    if (!caseDoc) {
      throw new AppError('Case not found', 404, 'NOT_FOUND');
    }

    if (caseDoc.status !== 'ready') {
      throw new AppError(
        `Case is not ready yet (current status: ${caseDoc.status})`,
        400,
        'NOT_FOUND'
      );
    }

    const sanitized = sanitizeCaseForClient(caseDoc);

    res.json({
      ok: true,
      data: sanitized,
    });
  } catch (err) {
    next(err);
  }
});

// GET /cases - current player's case history
router.get('/cases', async (req, res, next) => {
  try {
    const cases = await Case.find({ playerId: req.playerId })
      .sort({ createdAt: -1 })
      .limit(30);

    const data = cases.map((c) => ({
      id: c._id.toString(),
      title: c.title,
      status: c.status,
      difficulty: c.difficulty,
      tone: c.tone,
      createdAt: c.createdAt,
    }));

    res.json({
      ok: true,
      data,
    });
  } catch (err) {
    next(err);
  }
});

// POST /cases/:id/retry-generation
router.post('/cases/:id/retry-generation', async (req, res, next) => {
  try {
    const caseDoc = await Case.findOne({
      _id: req.params.id,
      playerId: req.playerId,
    });

    if (!caseDoc) {
      throw new AppError('Case not found', 404, 'NOT_FOUND');
    }

    if (caseDoc.status !== 'failed') {
      throw new AppError('Only failed cases can be retried', 400, 'VALIDATION_ERROR');
    }

    caseDoc.status = 'generating';
    caseDoc.generationStage = 'moderate';
    caseDoc.generationError = null;
    await caseDoc.save();

    import('../services/caseGenerator.js')
      .then((mod) => {
        if (typeof mod.startGenerationJob === 'function') {
          mod.startGenerationJob(caseDoc._id).catch(() => {});
        }
      })
      .catch(() => {});

    res.json({
      ok: true,
      data: {
        caseId: caseDoc._id.toString(),
        status: 'generating',
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;

