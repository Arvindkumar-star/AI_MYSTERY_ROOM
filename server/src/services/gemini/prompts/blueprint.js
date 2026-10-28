import { callGeminiStructured } from '../client.js';
import { BlueprintSchema } from '../schemas/caseSchemas.js';
import { env } from '../../../config/env.js';
import { fixtureCaseData } from '../../../../tests/fixtures/sampleCase.js';

const DIFFICULTY_CONFIG = {
  easy: { suspects: 4, evidenceMin: 8, evidenceMax: 10, redHerrings: 2 },
  medium: { suspects: 5, evidenceMin: 11, evidenceMax: 14, redHerrings: 3 },
  hard: { suspects: 6, evidenceMin: 14, evidenceMax: 18, redHerrings: 5 },
};

export async function generateBlueprint({ title, premise, difficulty = 'medium', tone = 'noir' }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG.medium;

  const systemInstruction = `You are a master mystery writer and puzzle designer.
Your task is to invent an internally consistent, fair, deductive detective mystery case.
RULES:
1. Everything is fiction. No real living people or brands in defamatory context.
${title ? `2. The case title is "${title}".` : '2. Provide an atmospheric, intriguing case title.'}
3. Generate exactly ${config.suspects} suspects (with IDs 's1', 's2', ...).
4. Designate exactly ONE culprit in solution.culpritId. The culprit MUST NOT be the most obvious suspect.
5. Each non-culprit suspect must have a plausible motive, but also an alibi or exculpatory clue to clear them upon deduction.
6. Plan ${config.evidenceMin} to ${config.evidenceMax} evidence items in cluePlan (IDs 'e1', 'e2', ...).
7. Evidence types must be drawn from: 'chat', 'document', 'image', 'cctv', 'statement', 'forensic', 'log'.
8. Plan exactly ${config.redHerrings} red herring clues that initially seem suspicious against an innocent suspect, but can be disproved.
9. At least 3 independent clues must point conclusively to the true culprit.
10. All names, times, places, and events must be mutually consistent across a single 24-hour timeline.
11. Match tone '${tone}'.
12. Return strictly JSON matching the required schema.`;

  const userPrompt = `${title ? `Case Title: "${title}"\n` : ''}Mystery Premise:
"""
${premise.replace(/"/g, '\\"')}
"""

Generate the complete case blueprint including setting, incident, suspects, solution, and cluePlan.`;

  const result = await callGeminiStructured({
    model: env.GROQ_API_KEY
      ? (env.GROQ_REASONING_MODEL || env.GROQ_TEXT_MODEL)
      : (env.GEMINI_REASONING_MODEL || env.GEMINI_TEXT_MODEL),
    systemInstruction,
    prompt: userPrompt,
    schema: BlueprintSchema,
  });

  if (!result) {
    // Development/offline fixture fallback
    return {
      title: fixtureCaseData.title,
      setting: fixtureCaseData.setting,
      incident: fixtureCaseData.incident,
      suspects: fixtureCaseData.suspects,
      solution: fixtureCaseData.solution,
      cluePlan: [
        {
          evidenceId: 'e1',
          type: 'chat',
          purpose: 'Show victim had tense argument with Thorne earlier',
          pointsTo: 's3',
          isRedHerring: false,
          clueStrength: 'supporting',
        },
        {
          evidenceId: 'e2',
          type: 'document',
          purpose: 'Proves Vance left pub early at 22:15, breaking his alibi',
          pointsTo: 's1',
          isRedHerring: false,
          clueStrength: 'decisive_link',
        },
        {
          evidenceId: 'e3',
          type: 'cctv',
          purpose: 'Watchman timeline spots figure in cap entering workshop at 23:35 and fleeing at 23:55',
          pointsTo: 's1',
          isRedHerring: false,
          clueStrength: 'decisive_link',
        },
        {
          evidenceId: 'e4',
          type: 'forensic',
          purpose: 'Coroner report identifies weapon residue as watchmaker brass filings',
          pointsTo: 's1',
          isRedHerring: false,
          clueStrength: 'decisive_link',
        },
        {
          evidenceId: 'e5',
          type: 'document',
          purpose: 'Unsigned will disinheriting Clara creates suspicion',
          pointsTo: 's2',
          isRedHerring: true,
          clueStrength: 'distraction',
        },
      ],
    };
  }

  return result;
}

