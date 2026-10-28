import { callGeminiStructured } from '../client.js';
import { z } from 'zod';
import { env } from '../../../config/env.js';

const HintOutputSchema = z.object({
  hint: z.string(),
});

export async function generateHint(caseDoc, investigation) {
  const culprit = caseDoc.suspects.find((s) => s.suspectId === caseDoc.solution?.culpritId);
  const culpritName = culprit ? culprit.name : '';
  const culpritId = caseDoc.solution?.culpritId || '';

  const systemInstruction = `You are a detective mentor providing a subtle hint to an investigator.
CRITICAL RULES:
1. NEVER mention the culprit's name ("${culpritName}") or ID ("${culpritId}").
2. Point toward a category of evidence, a discrepancy in a receipt, an alibi timeline gap, or a contradiction.
3. Keep the hint between 1 and 2 sentences.
4. Return JSON: { "hint": "..." }`;

  const prompt = `Case Title: ${caseDoc.title}
Key Clues that solve the case: ${JSON.stringify(caseDoc.solution?.keyEvidenceIds || [])}
Player's Notes so far: "${investigation.notes || 'None'}"
Player's Already Viewed Evidence: ${JSON.stringify(investigation.viewedEvidenceIds || [])}

Provide a thoughtful nudge.`;

  for (let attempt = 1; attempt <= 2; attempt++) {
    const result = await callGeminiStructured({
      model: env.GROQ_API_KEY ? env.GROQ_TEXT_MODEL : env.GEMINI_TEXT_MODEL,
      systemInstruction,
      prompt,
      schema: HintOutputSchema,
    });

    if (result && result.hint) {
      const lower = result.hint.toLowerCase();
      // Server-side leak check
      const leaksName = culpritName && lower.includes(culpritName.toLowerCase());
      const leaksId = culpritId && lower.includes(culpritId.toLowerCase());

      if (!leaksName && !leaksId) {
        return result.hint;
      }
    }
  }

  // Safe fallback if leak detected or offline
  return 'Compare the timestamps in the witness statements directly against the physical receipts and logs.';
}

