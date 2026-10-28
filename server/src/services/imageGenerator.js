import { GoogleGenAI } from '@google/genai';
import { Case } from '../models/Case.js';
import { Asset } from '../models/Asset.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { getGeminiClient } from './gemini/client.js';

const TONE_IMAGE_PREFIXES = {
  noir: 'grainy black-and-white photograph, high contrast, 1940s lighting, atmospheric shadows.',
  classic: 'vintage oil painting style, muted Edwardian palette, rich textures.',
  cozy: 'warm afternoon sunlight, soft watercolor and ink illustration.',
  thriller: 'cinematic desaturated color grading, shallow depth of field, dramatic shadows.',
  scifi: 'cyberpunk neon reflections in dark rain, futuristic surveillance aesthetic.',
};

/**
 * Asynchronously generates suspect portraits and key evidence images.
 * Does NOT block case playability. Degrades gracefully if models fail.
 */
export async function generateCaseImagesAsync(caseId) {
  const caseDoc = await Case.findById(caseId);
  if (!caseDoc) return;

  const client = getGeminiClient();
  if (!client) {
    logger.info(`Image generation skipped for case ${caseDoc._id} (Groq is active, image generation not required).`);
    return;
  }
  const maxImages = env.MAX_IMAGES_PER_CASE || 6;
  let imagesGenerated = 0;

  const tonePrefix = TONE_IMAGE_PREFIXES[caseDoc.tone] || TONE_IMAGE_PREFIXES.noir;

  // 1. Generate Suspect Portraits (up to 4)
  for (const suspect of caseDoc.suspects) {
    if (imagesGenerated >= maxImages) break;
    if (suspect.portraitAssetId) continue;

    try {
      const prompt = `${tonePrefix} Portrait bust shot of ${suspect.name}, ${suspect.occupation}, age ${suspect.age}. ${suspect.personality}. No text overlays, no real celebrities, no logos.`;

      if (client) {
        const response = await client.models.generateImages({
          model: env.GEMINI_IMAGE_MODEL || 'imagen-3.0-generate-002',
          prompt,
          config: {
            numberOfImages: 1,
            outputMimeType: 'image/jpeg',
          },
        });

        const imageBytes = response?.generatedImages?.[0]?.image?.imageBytes;
        if (imageBytes) {
          const buffer = Buffer.from(imageBytes, 'base64');
          const asset = await Asset.create({
            caseId: caseDoc._id,
            kind: 'portrait',
            mimeType: 'image/jpeg',
            data: buffer,
            size: buffer.length,
          });

          suspect.portraitAssetId = asset._id;
          imagesGenerated += 1;
        }
      }
    } catch (err) {
      logger.warn(`Portrait gen skipped for ${suspect.name}: ${err.message}`);
    }
  }

  // 2. Generate Evidence Images (if any image items exist)
  for (const ev of caseDoc.evidence) {
    if (imagesGenerated >= maxImages) break;
    if (ev.type === 'image' && ev.assetStatus === 'pending') {
      try {
        const prompt = `${tonePrefix} Crime investigation exhibit: ${ev.description}. Photographed from above, sharp focus. No text overlays, no logos.`;

        if (client) {
          const response = await client.models.generateImages({
            model: env.GEMINI_IMAGE_MODEL || 'imagen-3.0-generate-002',
            prompt,
            config: {
              numberOfImages: 1,
              outputMimeType: 'image/jpeg',
            },
          });

          const imageBytes = response?.generatedImages?.[0]?.image?.imageBytes;
          if (imageBytes) {
            const buffer = Buffer.from(imageBytes, 'base64');
            const asset = await Asset.create({
              caseId: caseDoc._id,
              kind: 'evidence_image',
              mimeType: 'image/jpeg',
              data: buffer,
              size: buffer.length,
            });

            ev.assetId = asset._id;
            ev.assetStatus = 'ready';
            imagesGenerated += 1;
            continue;
          }
        }
        ev.assetStatus = 'failed';
      } catch (err) {
        logger.warn(`Evidence image gen failed for ${ev.evidenceId}: ${err.message}`);
        ev.assetStatus = 'failed';
      }
    }
  }

  await caseDoc.save();
  logger.info(`Completed image generation run for case ${caseDoc._id}: ${imagesGenerated} assets created.`);
}

