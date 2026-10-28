import { callGeminiStructured } from '../client.js';
import { env } from '../../../config/env.js';
import { logger } from '../../../utils/logger.js';
import {
  ChatPayloadSchema,
  DocumentPayloadSchema,
  StatementPayloadSchema,
  CctvPayloadSchema,
  ForensicPayloadSchema,
  LogPayloadSchema,
  ImagePayloadSchema,
} from '../schemas/caseSchemas.js';

const SCHEMA_MAP = {
  chat: ChatPayloadSchema,
  document: DocumentPayloadSchema,
  statement: StatementPayloadSchema,
  cctv: CctvPayloadSchema,
  forensic: ForensicPayloadSchema,
  log: LogPayloadSchema,
  audio_transcript: LogPayloadSchema,
  image: ImagePayloadSchema,
};

export async function generateSingleEvidence({ blueprint, cluePlanItem }) {
  const schema = SCHEMA_MAP[cluePlanItem.type] || DocumentPayloadSchema;

  const prompt = `Case Blueprint:
Title: ${blueprint.title}
Incident: ${JSON.stringify(blueprint.incident)}
Setting: ${JSON.stringify(blueprint.setting)}
Suspects: ${JSON.stringify(blueprint.suspects.map((s) => ({ id: s.suspectId, name: s.name, statement: s.statement })))}
True Solution Timeline: ${JSON.stringify(blueprint.solution.timeline)}

Your Assignment:
Generate the payload for a single evidence item:
- Evidence ID: ${cluePlanItem.evidenceId}
- Type: ${cluePlanItem.type}
- Intended Purpose/Clue: ${cluePlanItem.purpose}
- Points To: ${cluePlanItem.pointsTo}
- Is Red Herring: ${cluePlanItem.isRedHerring}

RULES:
1. Embed the clue naturally and subtly. Never state explicitly that anyone is guilty.
2. For chats: write authentic, realistic dialogue with timestamps, typos, and natural phrasing.
3. For CCTV: provide a surveillance timeline with times and concise observation descriptions.
4. For documents: provide realistic headers and markdown body text.
5. All times must strictly adhere to the case timeline.
6. Return ONLY the payload JSON matching the schema for type "${cluePlanItem.type}".`;

  const result = await callGeminiStructured({
    model: env.GROQ_API_KEY ? env.GROQ_TEXT_MODEL : env.GEMINI_TEXT_MODEL,
    prompt,
    schema,
  });

  if (result) return result;

  // Fallback payload if offline / fallback
  if (cluePlanItem.type === 'cctv') {
    return {
      cameraId: 'CAM-01',
      location: blueprint?.incident?.location || 'Alley Security Feed',
      date: blueprint?.incident?.occurredAt?.slice(0, 10) || '1934-11-12',
      events: [
        {
          time: '23:35:00',
          description: cluePlanItem.purpose,
          suspectId: cluePlanItem.pointsTo || null,
        },
      ],
      gaps: [],
    };
  }

  if (cluePlanItem.type === 'chat') {
    return {
      platform: 'Private Telegram',
      participants: [cluePlanItem.pointsTo || 'Suspect', 'Victim'],
      messages: [
        {
          sender: cluePlanItem.pointsTo || 'Suspect',
          timestamp: '22:15',
          text: cluePlanItem.purpose,
        },
      ],
    };
  }

  if (cluePlanItem.type === 'forensic') {
    return {
      labNumber: 'LAB-204',
      examiner: 'Chief Medical Examiner',
      dateConducted: blueprint?.incident?.occurredAt?.slice(0, 10) || '1934-11-13',
      itemExamined: cluePlanItem.purpose,
      findings: [cluePlanItem.purpose],
      conclusiveMatch: !cluePlanItem.isRedHerring,
      matchedSuspectId: cluePlanItem.pointsTo || null,
    };
  }

  return {
    bodyMarkdown: cluePlanItem.purpose,
    docType: 'note',
  };
}

/**
 * Generates all evidence items in parallel batches (Section 8.1 batch size: 4)
 */
export async function generateAllEvidence({ blueprint }) {
  const cluePlan = blueprint.cluePlan || [];
  const generatedEvidence = [];
  const batchSize = 4;

  for (let i = 0; i < cluePlan.length; i += batchSize) {
    const batch = cluePlan.slice(i, i + batchSize);
    logger.info(`Generating evidence batch ${Math.floor(i / batchSize) + 1} (${batch.length} items)...`);

    const batchResults = await Promise.all(
      batch.map(async (item) => {
        try {
          const payload = await generateSingleEvidence({ blueprint, cluePlanItem: item });
          return {
            evidenceId: item.evidenceId,
            type: item.type,
            title: `${item.type.toUpperCase()}: ${item.purpose.slice(0, 40)}...`,
            description: item.purpose,
            discoveredAt: `Found during initial search at ${blueprint.incident?.location || 'crime scene'}`,
            isRedHerring: item.isRedHerring,
            payload,
            assetStatus: item.type === 'image' ? 'pending' : 'none',
          };
        } catch (err) {
          logger.warn(`Evidence item ${item.evidenceId} failed generation: ${err.message}`);
          return {
            evidenceId: item.evidenceId,
            type: item.type,
            title: `Evidence ${item.evidenceId}`,
            description: item.purpose,
            discoveredAt: 'Found at scene',
            isRedHerring: item.isRedHerring,
            payload: { bodyMarkdown: item.purpose, docType: 'note' },
            assetStatus: 'none',
          };
        }
      })
    );

    generatedEvidence.push(...batchResults);
  }

  return generatedEvidence;
}

