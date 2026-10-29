import { z } from 'zod';

// Difficulty and Tone Enums
export const DifficultyEnum = z.enum(['easy', 'medium', 'hard']);
export const ToneEnum = z.enum(['classic', 'noir', 'cozy', 'thriller', 'scifi']);

// Clue Plan Item Schema (Part of Blueprint)
export const CluePlanItemSchema = z.preprocess(
  (val) => {
    if (val && typeof val === 'object') {
      const obj = { ...val };
      if (!obj.evidenceId && obj.id) obj.evidenceId = String(obj.id);
      if (!obj.evidenceId) obj.evidenceId = 'e1';
      if (!obj.purpose && obj.description) obj.purpose = String(obj.description);
      if (!obj.purpose && obj.clue) obj.purpose = String(obj.clue);
      if (!obj.purpose && obj.details) obj.purpose = String(obj.details);
      if (!obj.purpose) obj.purpose = 'Critical crime scene evidence item.';
      if (!obj.pointsTo && obj.suspectId) obj.pointsTo = String(obj.suspectId);
      if (!obj.pointsTo && obj.suspect) obj.pointsTo = String(obj.suspect);
      if (!obj.pointsTo) obj.pointsTo = 's1';
      return obj;
    }
    if (typeof val === 'string') {
      return {
        evidenceId: 'e1',
        type: 'document',
        purpose: val,
        pointsTo: 's1',
        isRedHerring: false,
        clueStrength: 'supporting',
      };
    }
    return val;
  },
  z.object({
    evidenceId: z.string().default('e1'),
    type: z
      .string()
      .transform((v) => {
        const allowed = ['chat', 'document', 'image', 'cctv', 'statement', 'forensic', 'audio_transcript', 'log'];
        const lv = v.toLowerCase();
        if (lv.includes('cctv') || lv.includes('video') || lv.includes('cam')) return 'cctv';
        if (lv.includes('chat') || lv.includes('message') || lv.includes('sms')) return 'chat';
        if (lv.includes('forensic') || lv.includes('autopsy') || lv.includes('dna') || lv.includes('lab')) return 'forensic';
        if (lv.includes('statement') || lv.includes('witness') || lv.includes('interview')) return 'statement';
        if (lv.includes('log') || lv.includes('access')) return 'log';
        if (lv.includes('image') || lv.includes('photo')) return 'image';
        return allowed.includes(lv) ? lv : 'document';
      })
      .pipe(z.enum(['chat', 'document', 'image', 'cctv', 'statement', 'forensic', 'audio_transcript', 'log']))
      .default('document'),
    purpose: z.string().default('Clue recovered from crime scene.'),
    pointsTo: z.string().default('s1'),
    isRedHerring: z.preprocess((v) => Boolean(v), z.boolean()).default(false),
    clueStrength: z
      .string()
      .optional()
      .transform((v) => {
        if (!v) return 'supporting';
        const lv = v.toLowerCase();
        if (lv.includes('high') || lv.includes('decisive') || lv.includes('key') || lv.includes('primary')) return 'decisive_link';
        if (lv.includes('distract') || lv.includes('red') || lv.includes('herring') || lv.includes('low') || lv.includes('misleading')) return 'distraction';
        return 'supporting';
      })
      .pipe(z.enum(['decisive_link', 'supporting', 'distraction']))
      .default('supporting'),
  })
);

// Suspect Blueprint Schema
export const SuspectSchema = z.preprocess(
  (val) => {
    if (val && typeof val === 'object') {
      const obj = { ...val };
      if (!obj.suspectId && obj.id) obj.suspectId = String(obj.id);
      if (!obj.suspectId) obj.suspectId = 's1';
      if (!obj.name) obj.name = 'Suspect ' + obj.suspectId;
      if (!obj.claimedAlibi && obj.alibi) obj.claimedAlibi = String(obj.alibi);
      if (!obj.statement && obj.claimedAlibi) obj.statement = String(obj.claimedAlibi);
      if (!obj.statement) obj.statement = 'I was nowhere near the scene.';
      if (!obj.claimedAlibi) obj.claimedAlibi = 'Claims to have been elsewhere.';
      if (!obj.occupation && obj.role) obj.occupation = String(obj.role);
      if (!obj.portraitPrompt && obj.portrait) obj.portraitPrompt = String(obj.portrait);
      return obj;
    }
    return val;
  },
  z.object({
    suspectId: z.string().default('s1'),
    name: z.string().default('Suspect'),
    age: z.coerce.number().int().positive().default(35),
    occupation: z.string().default('Unknown'),
    relationToVictim: z.string().default('Acquaintance'),
    personality: z.string().default(''),
    claimedAlibi: z.string().default(''),
    statement: z.string().default(''),
    portraitPrompt: z.string().optional().default(''),
  })
);

const rawBlueprintSchema = z.object({
  title: z.string().default('Untitled Mystery'),
  setting: z
    .union([
      z.object({
        place: z.string().default('Crime Scene'),
        era: z.string().default('Contemporary'),
        atmosphere: z.string().default('Mysterious atmosphere'),
      }),
      z.string().transform((str) => ({
        place: str.slice(0, 80),
        era: 'Contemporary',
        atmosphere: str,
      })),
    ])
    .default({
      place: 'Crime Scene',
      era: 'Contemporary',
      atmosphere: 'Mysterious atmosphere',
    }),
  incident: z
    .union([
      z.object({
        summary: z.string().default('A crime has taken place.'),
        occurredAt: z.string().default('23:00'),
        location: z.string().default('Crime Scene'),
        victimName: z.string().optional().nullable().default('The Victim'),
      }),
      z.string().transform((str) => ({
        summary: str,
        occurredAt: '23:00',
        location: 'Crime Scene',
        victimName: 'The Victim',
      })),
    ])
    .default({
      summary: 'A crime has taken place.',
      occurredAt: '23:00',
      location: 'Crime Scene',
      victimName: 'The Victim',
    }),
  suspects: z.array(SuspectSchema).default([]),
  solution: z
    .object({
      culpritId: z.string().default('s1'),
      motive: z.string().default('Greed and hidden secrets'),
      method: z.string().default('Carefully executed foul play'),
      opportunity: z.string().default('Exploited gap in timeline'),
      timeline: z
        .array(
          z.union([
            z.object({
              time: z.string().default('22:00'),
              event: z.string().default('Suspicious movement observed'),
            }),
            z.string().transform((str) => {
              const parts = str.split(/[-:–]/);
              return { time: parts[0]?.trim() || '22:00', event: str.trim() };
            }),
          ])
        )
        .default([]),
      keyEvidenceIds: z.array(z.string()).default([]),
      redHerringExplanations: z
        .array(
          z.union([
            z.object({
              evidenceId: z.string().default('e1'),
              explanation: z.string().default('Misleading observation'),
            }),
            z.string().transform((str, i) => ({
              evidenceId: 'e2',
              explanation: str,
            })),
          ])
        )
        .default([]),
      fullExplanation: z.string().default('The culprit exploited an alibi gap to commit the crime.'),
    })
    .default({}),
  cluePlan: z.array(CluePlanItemSchema).default([]),
});

// Resilient Blueprint Schema with auto-indexing
export const BlueprintSchema = z.preprocess((val) => {
  if (val && typeof val === 'object') {
    const obj = { ...val };
    if (Array.isArray(obj.suspects)) {
      obj.suspects = obj.suspects.map((s, idx) => {
        if (typeof s === 'object' && s) {
          return { ...s, suspectId: s.suspectId || s.id || `s${idx + 1}` };
        }
        return { suspectId: `s${idx + 1}`, name: String(s) };
      });
    }
    if (Array.isArray(obj.cluePlan)) {
      obj.cluePlan = obj.cluePlan.map((c, idx) => {
        if (typeof c === 'object' && c) {
          return { ...c, evidenceId: c.evidenceId || c.id || `e${idx + 1}` };
        }
        return { evidenceId: `e${idx + 1}`, purpose: String(c) };
      });
    }
    if (obj.solution && typeof obj.solution === 'object') {
      const sol = { ...obj.solution };
      if (!sol.culpritId && sol.culprit) sol.culpritId = String(sol.culprit);
      if (!sol.culpritId && obj.suspects?.[0]?.suspectId) sol.culpritId = obj.suspects[0].suspectId;
      obj.solution = sol;
    }
    return obj;
  }
  return val;
}, rawBlueprintSchema);

// Evidence Payload Schemas (Section 9)
export const ChatPayloadSchema = z.object({
  app: z.string().default('chat'),
  isGroup: z.boolean().default(false),
  participants: z
    .array(
      z.union([
        z.object({ name: z.string(), suspectId: z.string().optional() }),
        z.string().transform((s) => ({ name: s })),
      ])
    )
    .default([]),
  messages: z
    .array(
      z.object({
        sender: z.string().default('Unknown'),
        text: z.string().default(''),
        timestamp: z.string().default(''),
        status: z.enum(['sent', 'delivered', 'read']).default('read'),
        deleted: z.boolean().default(false),
      })
    )
    .default([]),
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
  events: z
    .array(
      z.object({
        time: z.string(),
        description: z.string(),
        suspectId: z.string().nullable().optional(),
        keyframePrompt: z.string().optional(),
        keyframeAssetId: z.string().nullable().optional(),
      })
    )
    .default([]),
  gaps: z
    .array(
      z.object({
        from: z.string(),
        to: z.string(),
        reason: z.string(),
      })
    )
    .default([]),
});

export const ForensicPayloadSchema = z.object({
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
