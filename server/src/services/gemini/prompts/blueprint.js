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

  const systemInstruction = `You are a master mystery novelist and puzzle architect.
Your mission is to invent a 100% UNIQUE, ORIGINAL, internally consistent detective mystery case based on the user's premise.

CRITICAL VARIETY & DEDUCTIVE RULES:
1. ORIGINAL CHARACTERS: Every name, victim, occupation, and setting must be invented uniquely for this premise. NEVER reuse static names like Arthur Pendelton or Julian Vance unless the user specifically asked for them.
2. RANDOMIZED CULPRIT: Assign the culpritId to any one of the suspects randomly (e.g. 's1', 's2', 's3', 's4', 's5'). NEVER default to 's1'.
3. EXACT SUSPECT COUNT: Create exactly ${config.suspects} suspects (with IDs 's1', 's2', ... 's${config.suspects}').
4. FAIR ALIBIS: Every innocent suspect must have a verifiable alibi or clear reason they could not have committed the crime. The true culprit's alibi must contain a subtle flaw disproved by physical clues.
5. DIVERSE CLUE PLAN: Plan ${config.evidenceMin} to ${config.evidenceMax} clues in cluePlan (IDs 'e1', 'e2', ...). Spread across: 'cctv', 'chat', 'document', 'forensic', 'statement', 'log'.
6. RED HERRINGS: Include exactly ${config.redHerrings} red herring clues that create suspicion against innocent suspects but can be disproved.
7. TIMELINE CONSISTENCY: Build a coherent timeline fitting the era of the premise.
8. RETURN VALID JSON: Match the required JSON structure strictly.`;

  const userPrompt = `${title ? `Case Title: "${title}"\n` : ''}Mystery Premise:
"""
${premise.replace(/"/g, '\\"')}
"""
Tone: ${tone}
Difficulty: ${difficulty}

You must return a valid JSON object matching this structure:
{
  "title": "Creative Title For This Case",
  "setting": {
    "place": "Specific crime location",
    "era": "Time period",
    "atmosphere": "Sensory mood"
  },
  "incident": {
    "summary": "Detailed narrative of the crime that occurred",
    "occurredAt": "Time of crime (e.g. 23:15 or 03:00)",
    "location": "Specific crime scene room or venue",
    "victimName": "Full name of the victim"
  },
  "suspects": [
    {
      "suspectId": "s1",
      "name": "Full Name",
      "age": 34,
      "occupation": "Job Title",
      "relationToVictim": "Relationship",
      "personality": "Personality traits",
      "claimedAlibi": "Their claimed alibi and whereabouts",
      "statement": "What they said when questioned",
      "portraitPrompt": "Visual description"
    }
  ],
  "solution": {
    "culpritId": "s2",
    "motive": "Why they did it",
    "method": "How they did it",
    "opportunity": "How they got around their alibi",
    "timeline": [
      { "time": "21:00", "event": "Early relevant event" },
      { "time": "23:15", "event": "The murder takes place" }
    ],
    "keyEvidenceIds": ["e1", "e3"],
    "redHerringExplanations": [
      { "evidenceId": "e2", "explanation": "Why this innocent suspect looked suspicious" }
    ],
    "fullExplanation": "Step-by-step breakdown of how the culprit committed the crime and how clues prove it"
  },
  "cluePlan": [
    {
      "evidenceId": "e1",
      "type": "cctv",
      "purpose": "What this clue reveals and how it proves guilt or innocence",
      "pointsTo": "s2",
      "isRedHerring": false,
      "clueStrength": "decisive_link"
    }
  ]
}`;

  const result = await callGeminiStructured({
    model: env.GROQ_API_KEY
      ? (env.GROQ_REASONING_MODEL || env.GROQ_TEXT_MODEL)
      : (env.GEMINI_REASONING_MODEL || env.GEMINI_TEXT_MODEL),
    systemInstruction,
    prompt: userPrompt,
    schema: BlueprintSchema,
  });

  if (!result) {
    // Only in test or offline emergency
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
