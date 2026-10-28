import { callGeminiStructured } from './gemini/client.js';
import { z } from 'zod';
import { logger } from '../utils/logger.js';

const BANNED_PATTERNS = [
  /child\s+(abuse|sexual|exploitation)/i,
  /suicide\s+(instruction|method)/i,
  /real\s+bomb\s+(recipe|instructions)/i,
  /defamation/i,
];

const ModerationOutputSchema = z.object({
  allowed: z.boolean(),
  reason: z.string().optional().default(''),
});

export async function moderatePremise(premise) {
  // Fast local keyword screening
  for (const pattern of BANNED_PATTERNS) {
    if (pattern.test(premise)) {
      return {
        allowed: false,
        reason: 'Premise contains prohibited real-world harm or sensitive topics.',
      };
    }
  }

  // LLM classification if API key is present
  try {
    const result = await callGeminiStructured({
      prompt: `Analyze the following mystery premise for harmful real-world content:
"""
${premise.replace(/"/g, '\\"')}
"""

Rules:
- Fictional murder mysteries, whodunits, heists, and classic detective tropes are ALLOWED.
- Reject premises with sexual violence, child exploitation, glorification of real tragedies, or actionable instructions for real harm.
Return JSON: { "allowed": true/false, "reason": "short explanation" }`,
      schema: ModerationOutputSchema,
    });

    if (result && !result.allowed) {
      return result;
    }
  } catch (err) {
    logger.warn(`Moderation check encountered an error: ${err.message}. Defaulting to safe pass.`);
  }

  return { allowed: true };
}

