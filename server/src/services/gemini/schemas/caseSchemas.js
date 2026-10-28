import { z } from 'zod';

// Difficulty and Tone Enums
export const DifficultyEnum = z.enum(['easy', 'medium', 'hard']);
export const ToneEnum = z.enum(['classic', 'noir', 'cozy', 'thriller', 'scifi']);

// Clue Plan Item Schema (Part of Blueprint)
export const CluePlanItemSchema = z.object({
  evidenceId: z.string(),
  type: z.enum(['chat', 'document', 'image', 'cctv', 'statement', 'forensic', 'audio_transcript', 'log']),
  purpose: z.string(),
  pointsTo: z.string(), // suspectId or 'none' / 'red_herring'
  isRedHerring: z.boolean(),
  clueStrength: z.enum(['decisive_link', 'supporting', 'distraction']),
});

// Suspect Blueprint Schema
export const SuspectSchema = z.object({
  suspectId: z.string(),
  name: z.string(),
  age: z.number().int().positive(),
  occupation: z.string(),
  relationToVictim: z.string(),
  personality: z.string(),
  claimedAlibi: z.string(),
  statement: z.string(),
  portraitPrompt: z.string(),
});

// Blueprint Schema
export const BlueprintSchema = z.object({
  title: z.string(),
  setting: z.object({
    place: z.string(),
    era: z.string(),
    atmosphere: z.string(),
  }),
  incident: z.object({
    summary: z.string(),
    occurredAt: z.string(),
    location: z.string(),
    victimName: z.string().optional().nullable(),
  }),
  suspects: z.array(SuspectSchema),
  solution: z.object({
    culpritId: z.string(),
    motive: z.string(),
    method: z.string(),
    opportunity: z.string(),
    timeline: z.array(
      z.object({
        time: z.string(),
        event: z.string(),
      })
    ),
    keyEvidenceIds: z.array(z.string()),
    redHerringExplanations: z.array(
      z.object({
        evidenceId: z.string(),
        explanation: z.string(),
      })
    ),
    fullExplanation: z.string(),
  }),
  cluePlan: z.array(CluePlanItemSchema),
});

// Evidence Payload Schemas (Section 9)
export const ChatPayloadSchema = z.object({
  app: z.string().default('chat'),
  isGroup: z.boolean().default(false),
  // Gemini sometimes returns participants as strings; normalize to objects
  participants: z
    .array(z.union([
      z.object({ name: z.string(), suspectId: z.string().optional() }),
      z.string().transform((s) => ({ name: s })),
    ]))
    .default([]),
  messages: z.array(
    z.object({
      sender: z.string().default('Unknown'),
      text: z.string().default(''),
      timestamp: z.string().default(''),
      status: z.enum(['sent', 'delivered', 'read']).default('read'),
      deleted: z.boolean().default(false),
    })
  ).default([]),
});

export const DocumentPayloadSchema = z.object({
  docType: z
    .string()
    .transform((v) => {
      const allowed = ['email', 'receipt', 'contract', 'letter', 'invoice', 'report', 'note'];
      return allowed.includes(v) ? v : 'note';
    })
    .pipe(z.enum(['email', 'receipt', 'contract', 'letter', 'invoice', 'report', 'note'])),
  header: z.record(z.any()).default({}),
  bodyMarkdown: z.string().default(''),
  footer: z.string().optional().default(''),
});

export const StatementPayloadSchema = z.object({
  speakerName: z.string().default('Witness'),
  speakerRole: z
    .string()
    .transform((v) => (['witness', 'suspect', 'officer'].includes(v) ? v : 'witness'))
    .pipe(z.enum(['witness', 'suspect', 'officer'])),
  takenAt: z.string().default(''),
  transcript: z.string().default(''),
  reliabilityNote: z.string().optional().default(''),
});

export const CctvPayloadSchema = z.object({
  cameraId: z.string().default('CAM-01'),
  location: z.string().default('Unknown'),
  date: z.string().default(''),
  events: z.array(
    z.object({
      time: z.string(),
      description: z.string(),
      suspectId: z.string().nullable().optional(),
      keyframePrompt: z.string().optional(),
      keyframeAssetId: z.string().nullable().optional(),
    })
  ).default([]),
  gaps: z.array(
    z.object({
      from: z.string(),
      to: z.string(),
      reason: z.string(),
    })
  ).default([]),
});

export const ForensicPayloadSchema = z.object({
  // Gemini may return freeform strings; normalize to valid enum or 'autopsy'
  reportType: z
    .string()
    .transform((v) => {
      const lv = v.toLowerCase();
      if (lv.includes('fingerprint')) return 'fingerprint';
      if (lv.includes('toxicol')) return 'toxicology';
      if (lv.includes('digital')) return 'digital';
      if (lv.includes('ballistic')) return 'ballistics';
      return 'autopsy';
    })
    .pipe(z.enum(['autopsy', 'fingerprint', 'toxicology', 'digital', 'ballistics'])),
  // Gemini may return findings as a string or array of objects/strings
  findings: z
    .union([
      z.array(z.object({ label: z.string(), value: z.string() })),
      z.array(z.string()).transform((arr) => arr.map((s, i) => ({ label: `Finding ${i + 1}`, value: s }))),
      z.string().transform((s) => [{ label: 'Summary', value: s }]),
    ])
    .default([]),
  conclusion: z.string().default(''),
});

export const LogPayloadSchema = z.object({
  logType: z.string().default('access_log'),
  entries: z.array(
    z.object({
      time: z.string(),
      source: z.string(),
      entry: z.string(),
    })
  ),
});

export const ImagePayloadSchema = z.object({
  caption: z.string(),
  imagePrompt: z.string().optional(),
  altText: z.string().default('Crime scene visual evidence'),
  annotations: z
    .array(
      z.object({
        label: z.string(),
        x: z.number().min(0).max(1),
        y: z.number().min(0).max(1),
      })
    )
    .default([]),
});

// Single Evidence Item Schema
export const EvidenceItemSchema = z.object({
  evidenceId: z.string(),
  type: z.enum(['chat', 'document', 'image', 'cctv', 'statement', 'forensic', 'audio_transcript', 'log']),
  title: z.string(),
  description: z.string(),
  discoveredAt: z.string(),
  isRedHerring: z.boolean(),
  payload: z.record(z.any()),
  assetId: z.string().nullable().optional(),
  assetStatus: z.enum(['none', 'pending', 'ready', 'failed']).default('none'),
});

// Solver Output Schema (Blind Verification)
export const SolverResponseSchema = z.object({
  culpritId: z.string(),
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
  evidenceUsed: z.array(z.string()),
});

