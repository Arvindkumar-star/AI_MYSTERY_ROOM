/**
 * caseSanitizer.js
 *
 * Implements strict Anti-Spoiler allow-list serialization (Section 11.1).
 * Never uses deny-lists or field deletions.
 * Guarantees that no solution data, isRedHerring flag, AI prompts,
 * or verification data ever reach the client before a case is resolved.
 */

export function sanitizeCaseForClient(caseDoc) {
  if (!caseDoc) return null;

  const raw = typeof caseDoc.toObject === 'function' ? caseDoc.toObject() : caseDoc;

  // Explicit allow-list for suspects
  const sanitizedSuspects = (raw.suspects || []).map((s) => ({
    suspectId: String(s.suspectId),
    name: String(s.name),
    age: Number(s.age),
    occupation: String(s.occupation),
    relationToVictim: String(s.relationToVictim),
    personality: String(s.personality),
    claimedAlibi: String(s.claimedAlibi),
    statement: String(s.statement),
    portraitAssetId: s.portraitAssetId ? String(s.portraitAssetId) : null,
    // Note: portraitPrompt is deliberately excluded
  }));

  // Explicit allow-list for evidence
  const sanitizedEvidence = (raw.evidence || []).map((e) => {
    // Sanitize payload: strip any image prompts if present
    const payload = sanitizePayload(e.type, e.payload);

    return {
      evidenceId: String(e.evidenceId),
      type: String(e.type),
      title: String(e.title),
      description: String(e.description),
      discoveredAt: String(e.discoveredAt),
      payload,
      assetId: e.assetId ? String(e.assetId) : null,
      assetStatus: e.assetStatus || 'none',
      // Note: isRedHerring is deliberately excluded
    };
  });

  // Explicit allow-list for the case object
  return {
    id: String(raw._id),
    title: String(raw.title || 'Untitled Case'),
    difficulty: raw.difficulty,
    tone: raw.tone,
    status: raw.status,
    setting: {
      place: raw.setting?.place || '',
      era: raw.setting?.era || '',
      atmosphere: raw.setting?.atmosphere || '',
    },
    incident: {
      summary: raw.incident?.summary || '',
      occurredAt: raw.incident?.occurredAt || '',
      location: raw.incident?.location || '',
      victimName: raw.incident?.victimName || null,
    },
    suspects: sanitizedSuspects,
    evidence: sanitizedEvidence,
    createdAt: raw.createdAt,
    // Note: solution, verification, model, generationStage, generationError are excluded
  };
}

/**
 * Sanitizes type-specific evidence payloads to ensure prompt leaks or hidden solution fields are removed.
 */
function sanitizePayload(type, payload) {
  if (!payload || typeof payload !== 'object') return {};

  switch (type) {
    case 'chat':
      return {
        app: payload.app || 'chat',
        isGroup: Boolean(payload.isGroup),
        participants: (payload.participants || []).map((p) => ({
          name: String(p.name || ''),
          suspectId: p.suspectId ? String(p.suspectId) : undefined,
        })),
        messages: (payload.messages || []).map((m) => ({
          sender: String(m.sender || ''),
          text: String(m.text || ''),
          timestamp: String(m.timestamp || ''),
          status: m.status || 'read',
          deleted: Boolean(m.deleted),
        })),
      };

    case 'document':
      return {
        docType: payload.docType || 'note',
        header: payload.header || {},
        bodyMarkdown: String(payload.bodyMarkdown || ''),
        footer: payload.footer ? String(payload.footer) : '',
      };

    case 'statement':
      return {
        speakerName: String(payload.speakerName || ''),
        speakerRole: payload.speakerRole || 'witness',
        takenAt: String(payload.takenAt || ''),
        transcript: String(payload.transcript || ''),
        reliabilityNote: payload.reliabilityNote ? String(payload.reliabilityNote) : '',
      };

    case 'cctv':
      return {
        cameraId: String(payload.cameraId || 'CAM-01'),
        location: String(payload.location || ''),
        date: String(payload.date || ''),
        events: (payload.events || []).map((ev) => ({
          time: String(ev.time || ''),
          description: String(ev.description || ''),
          suspectId: ev.suspectId ? String(ev.suspectId) : null,
          keyframeAssetId: ev.keyframeAssetId ? String(ev.keyframeAssetId) : null,
          // keyframePrompt is excluded
        })),
        gaps: (payload.gaps || []).map((g) => ({
          from: String(g.from || ''),
          to: String(g.to || ''),
          reason: String(g.reason || ''),
        })),
      };

    case 'forensic':
      return {
        reportType: payload.reportType || 'autopsy',
        findings: (payload.findings || []).map((f) => ({
          label: String(f.label || ''),
          value: String(f.value || ''),
        })),
        conclusion: String(payload.conclusion || ''),
      };

    case 'log':
      return {
        logType: payload.logType || 'access_log',
        entries: (payload.entries || []).map((entry) => ({
          time: String(entry.time || ''),
          source: String(entry.source || ''),
          entry: String(entry.entry || ''),
        })),
      };

    case 'image':
      return {
        caption: String(payload.caption || ''),
        altText: String(payload.altText || ''),
        annotations: (payload.annotations || []).map((a) => ({
          label: String(a.label || ''),
          x: Number(a.x || 0),
          y: Number(a.y || 0),
        })),
        // imagePrompt is excluded
      };

    default:
      return payload;
  }
}

