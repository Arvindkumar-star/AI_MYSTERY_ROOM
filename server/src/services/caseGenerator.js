import { Case } from '../models/Case.js';
import { logger } from '../utils/logger.js';
import { moderatePremise } from './moderation.service.js';
import { generateBlueprint } from './gemini/prompts/blueprint.js';
import { generateAllEvidence, generateSingleEvidence } from './gemini/prompts/evidence.js';
import { runBlindVerification } from './gemini/prompts/verify.js';
import { sanitizeCaseForClient } from './caseSanitizer.js';
import { env } from '../config/env.js';

export async function startGenerationJob(caseId) {
  const caseDoc = await Case.findById(caseId).select('+solution');
  if (!caseDoc) {
    logger.error(`Case ${caseId} not found to start generation.`);
    return;
  }

  try {
    // Stage 0: Moderate
    caseDoc.generationStage = 'moderate';
    await caseDoc.save();

    const modResult = await moderatePremise(caseDoc.premise);
    if (!modResult.allowed) {
      caseDoc.status = 'failed';
      caseDoc.generationError =
        modResult.reason || "We couldn't build that case. Try a different premise.";
      await caseDoc.save();
      return;
    }

    // Stage 1: Blueprint
    caseDoc.generationStage = 'blueprint';
    await caseDoc.save();

    const hasUserTitle = caseDoc.title && caseDoc.title !== 'Untitled Mystery';

    const blueprint = await generateBlueprint({
      title: hasUserTitle ? caseDoc.title : undefined,
      premise: caseDoc.premise,
      difficulty: caseDoc.difficulty,
      tone: caseDoc.tone,
    });

    if (!hasUserTitle) {
      caseDoc.title = blueprint.title || 'Untitled Mystery';
    }
    caseDoc.setting = blueprint.setting;
    caseDoc.incident = blueprint.incident;
    caseDoc.suspects = blueprint.suspects;
    caseDoc.solution = blueprint.solution;
    caseDoc.model = {
      textModel: env.GROQ_API_KEY ? env.GROQ_TEXT_MODEL : env.GEMINI_TEXT_MODEL,
      imageModel: env.GEMINI_API_KEY ? env.GEMINI_IMAGE_MODEL : 'none',
    };
    await caseDoc.save();

    // Stage 2: Evidence
    caseDoc.generationStage = 'evidence';
    await caseDoc.save();

    let evidenceList = await generateAllEvidence({ blueprint });
    caseDoc.evidence = evidenceList;
    await caseDoc.save();

    // Stage 3: Verification (Blind Solver)
    caseDoc.generationStage = 'verify';
    await caseDoc.save();

    let sanitized = sanitizeCaseForClient(caseDoc);
    let verifyResult = await runBlindVerification({
      sanitizedCase: sanitized,
      blueprintCulpritId: blueprint.solution.culpritId,
    });

    // Stage 4: Repair loop (max 2 attempts)
    let repairAttempts = 0;
    while (!verifyResult.passed && repairAttempts < 2) {
      repairAttempts += 1;
      caseDoc.generationStage = 'repair';
      await caseDoc.save();
      logger.info(`Verification failed. Starting repair attempt ${repairAttempts}/2...`);

      // Strengthen weakest clue
      const keyClues = blueprint.cluePlan.filter((c) => c.pointsTo === blueprint.solution.culpritId);
      if (keyClues.length > 0) {
        const clueToStrengthen = keyClues[repairAttempts % keyClues.length];
        clueToStrengthen.purpose += ' (Make this connection clearer and directly tied to the timeline).';
        const updatedPayload = await generateSingleEvidence({
          blueprint,
          cluePlanItem: clueToStrengthen,
        });

        const evIndex = caseDoc.evidence.findIndex((e) => e.evidenceId === clueToStrengthen.evidenceId);
        if (evIndex !== -1) {
          caseDoc.evidence[evIndex].payload = updatedPayload;
        }
      }

      sanitized = sanitizeCaseForClient(caseDoc);
      verifyResult = await runBlindVerification({
        sanitizedCase: sanitized,
        blueprintCulpritId: blueprint.solution.culpritId,
      });
    }

    caseDoc.verification = {
      passed: verifyResult.passed,
      solverAnswerId: verifyResult.solverAnswerId,
      notes: verifyResult.reasoning || '',
      attempts: repairAttempts + 1,
    };

    if (!verifyResult.passed) {
      caseDoc.status = 'failed';
      caseDoc.generationError =
        'Case failed fair solvability verification. Please retry to generate a new variation.';
      await caseDoc.save();
      return;
    }

    // Stage 5: Persist Ready
    caseDoc.status = 'ready';
    caseDoc.generationStage = 'done';
    await caseDoc.save();
    logger.info(`Case ${caseDoc._id} successfully generated and verified.`);

    // Stage 6: Background Images (Triggered asynchronously, does not block readiness)
    import('./imageGenerator.js')
      .then((mod) => {
        if (typeof mod.generateCaseImagesAsync === 'function') {
          mod.generateCaseImagesAsync(caseDoc._id).catch((err) => {
            logger.warn(`Background image generation completed with warnings: ${err.message}`);
          });
        }
      })
      .catch(() => {});
  } catch (err) {
    logger.error(`Generation job failed: ${err.message}`);
    caseDoc.status = 'failed';
    caseDoc.generationError = `Generation error: ${err.message}`;
    await caseDoc.save();
  }
}
