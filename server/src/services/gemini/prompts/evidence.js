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

  const targetSuspect = blueprint.suspects?.find((s) => s.suspectId === cluePlanItem.pointsTo) || blueprint.suspects?.[0];
  const suspectName = targetSuspect?.name || 'Key Suspect';
  const victimName = blueprint.incident?.victimName || 'Victim';
  const crimeTime = blueprint.incident?.occurredAt || '23:00';
  const crimeDate = blueprint.incident?.occurredAt?.slice(0, 10) || '2024-10-15';
  const location = blueprint.incident?.location || 'Crime Scene';

  const typeInstructions = {
    cctv: `Return valid JSON with this exact structure:
{
  "cameraId": "CAM-${cluePlanItem.evidenceId.toUpperCase()}",
  "location": "${location}",
  "date": "${crimeDate}",
  "events": [
    {
      "time": "${crimeTime}",
      "description": "${cluePlanItem.purpose.replace(/"/g, "'")}",
      "suspectId": "${cluePlanItem.pointsTo}"
    }
  ],
  "gaps": []
}`,
    chat: `Return valid JSON with this exact structure:
{
  "app": "Private Chat",
  "isGroup": false,
  "participants": [
    { "name": "${suspectName}", "suspectId": "${cluePlanItem.pointsTo}" },
    { "name": "${victimName}" }
  ],
  "messages": [
    {
      "sender": "${suspectName}",
      "text": "Message embedding the clue: ${cluePlanItem.purpose.replace(/"/g, "'")}",
      "timestamp": "${crimeTime}",
      "status": "read",
      "deleted": false
    }
  ]
}`,
    document: `Return valid JSON with this exact structure:
{
  "docType": "report",
  "header": { "Title": "${cluePlanItem.purpose.slice(0, 40)}", "Date": "${crimeDate}" },
  "bodyMarkdown": "${cluePlanItem.purpose.replace(/"/g, "'")}",
  "footer": "Authenticated Record"
}`,
    forensic: `Return valid JSON with this exact structure:
{
  "reportType": "autopsy",
  "findings": [
    { "label": "Key Finding", "value": "${cluePlanItem.purpose.replace(/"/g, "'")}" }
  ],
  "conclusion": "Forensic examination consistent with scene findings."
}`,
    statement: `Return valid JSON with this exact structure:
{
  "speakerName": "${suspectName}",
  "speakerRole": "suspect",
  "takenAt": "${crimeTime}",
  "transcript": "${cluePlanItem.purpose.replace(/"/g, "'")}",
  "reliabilityNote": "Official statement on record."
}`,
    log: `Return valid JSON with this exact structure:
{
  "logType": "access_log",
  "entries": [
    { "time": "${crimeTime}", "source": "Security Terminal", "entry": "${cluePlanItem.purpose.replace(/"/g, "'")}" }
  ]
}`,
  };

  const specificFormat = typeInstructions[cluePlanItem.type] || typeInstructions.document;

  const prompt = `Case File:
Title: ${blueprint.title}
Incident: ${JSON.stringify(blueprint.incident)}
Setting: ${JSON.stringify(blueprint.setting)}
Assigned Clue:
- Evidence ID: ${cluePlanItem.evidenceId}
- Type: ${cluePlanItem.type}
- Purpose: ${cluePlanItem.purpose}
- Associated Suspect: ${suspectName} (${cluePlanItem.pointsTo})
- Is Red Herring: ${cluePlanItem.isRedHerring}

${specificFormat}

Embed the clue naturally. Output strictly JSON matching the required schema.`;

  const result = await callGeminiStructured({
    model: env.GROQ_API_KEY ? env.GROQ_TEXT_MODEL : env.GEMINI_TEXT_MODEL,
    prompt,
    schema,
  });

  // Verify result has actual contents, otherwise build dynamic fallback from case data
  if (result) {
    if (cluePlanItem.type === 'cctv' && (!result.events || result.events.length === 0)) {
      result.events = [
        {
          time: crimeTime,
          description: cluePlanItem.purpose,
          suspectId: cluePlanItem.pointsTo || null,
        },
      ];
    }
    return result;
  }

  // Dynamic case-specific fallback (NEVER static 1934 or Pendelton)
  if (cluePlanItem.type === 'cctv') {
    return {
      cameraId: `CAM-${cluePlanItem.evidenceId.toUpperCase()}`,
      location,
      date: crimeDate,
      events: [
        {
          time: crimeTime,
          description: cluePlanItem.purpose,
          suspectId: cluePlanItem.pointsTo || null,
        },
      ],
      gaps: [],
    };
  }

  if (cluePlanItem.type === 'chat') {
    return {
      app: 'Private Chat',
      isGroup: false,
      participants: [
        { name: suspectName, suspectId: cluePlanItem.pointsTo },
        { name: victimName },
      ],
      messages: [
        {
          sender: suspectName,
          timestamp: crimeTime,
          text: cluePlanItem.purpose,
          status: 'read',
          deleted: false,
        },
      ],
    };
  }

  if (cluePlanItem.type === 'forensic') {
    return {
      reportType: 'autopsy',
      findings: [{ label: 'Forensic Finding', value: cluePlanItem.purpose }],
      conclusion: 'Conclusive analysis on file.',
    };
  }

  if (cluePlanItem.type === 'statement') {
    return {
      speakerName: suspectName,
      speakerRole: 'suspect',
      takenAt: crimeTime,
      transcript: cluePlanItem.purpose,
      reliabilityNote: 'Interrogation transcript on file.',
    };
  }

  return {
    docType: 'report',
    header: { Title: `Case Exhibit ${cluePlanItem.evidenceId}`, Date: crimeDate },
    bodyMarkdown: cluePlanItem.purpose,
    footer: 'Official Case Record',
  };
}

/**
 * Generates all evidence items in parallel batches
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
            title: `${item.type.toUpperCase()}: ${item.purpose.slice(0, 45)}...`,
            description: item.purpose,
            discoveredAt: `Found during investigation at ${blueprint.incident?.location || 'crime scene'}`,
            isRedHerring: item.isRedHerring,
            payload,
            assetStatus: item.type === 'image' ? 'pending' : 'none',
          };
        } catch (err) {
          logger.warn(`Evidence item ${item.evidenceId} generation failed: ${err.message}`);
          return {
            evidenceId: item.evidenceId,
            type: item.type,
            title: `Evidence ${item.evidenceId}`,
            description: item.purpose,
            discoveredAt: 'Found at crime scene',
            isRedHerring: item.isRedHerring,
            payload: {
              docType: 'report',
              bodyMarkdown: item.purpose,
            },
            assetStatus: 'none',
          };
        }
      })
    );

    generatedEvidence.push(...batchResults);
  }

  return generatedEvidence;
}
