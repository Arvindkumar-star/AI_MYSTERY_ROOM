import { GoogleGenAI } from '@google/genai';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import { callGroqStructured, getGroqClient } from '../groq/client.js';

let geminiClient = null;

export function getGeminiClient() {
  if (!geminiClient && env.GEMINI_API_KEY && env.GEMINI_API_KEY.trim() !== '') {
    geminiClient = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  }
  return geminiClient;
}

/**
 * Executes a structured AI request. Prefers Groq if GROQ_API_KEY is configured,
 * otherwise falls back to Gemini or fixture mock generation.
 */
export async function callGeminiStructured({
  model,
  systemInstruction,
  prompt,
  schema,
  maxRetries = 3,
  timeoutMs,
}) {
  // If Groq key is present or Groq is requested, delegate to Groq
  if (env.GROQ_API_KEY && env.GROQ_API_KEY.trim() !== '') {
    const groqModel =
      model && !model.startsWith('gemini')
        ? model
        : env.GROQ_TEXT_MODEL || 'llama-3.3-70b-versatile';

    return callGroqStructured({
      model: groqModel,
      systemInstruction,
      prompt,
      schema,
      maxRetries,
      timeoutMs: timeoutMs || env.GROQ_TIMEOUT_MS,
    });
  }

  // Offline test fixtures support
  if (process.env.NODE_ENV === 'test' || process.env.OFFLINE_AI === 'true') {
    return null;
  }

  const client = getGeminiClient();

  if (!client) {
    logger.warn('No GROQ_API_KEY or GEMINI_API_KEY configured. Returning fallback structured response.');
    return null;
  }

  let lastError = null;
  let currentPrompt = prompt;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs || env.GEMINI_TIMEOUT_MS);

      const contents = [{ role: 'user', parts: [{ text: currentPrompt }] }];

      const requestConfig = {
        responseMimeType: 'application/json',
      };
      if (systemInstruction) {
        requestConfig.systemInstruction = systemInstruction;
      }

      const response = await client.models.generateContent({
        model: model || env.GEMINI_TEXT_MODEL,
        contents,
        config: requestConfig,
      });

      clearTimeout(timeoutId);

      const text = response.text;
      if (!text) {
        throw new Error('Empty response received from Gemini');
      }

      const parsedJson = JSON.parse(text);

      if (schema) {
        const validation = schema.safeParse(parsedJson);
        if (!validation.success) {
          logger.warn(
            { attempt, errors: validation.error.format() },
            'Gemini output validation failed'
          );

          if (attempt < maxRetries) {
            currentPrompt += `\n\nCRITICAL FIX: Your previous JSON output failed validation with error: ${JSON.stringify(
              validation.error.format()
            )}. Ensure the JSON strictly matches the expected schema.`;
            continue;
          }
          throw new Error(`Schema validation failed after ${maxRetries} attempts`);
        }
        return validation.data;
      }

      return parsedJson;
    } catch (err) {
      lastError = err;
      logger.warn(
        { attempt, err: err.message },
        `Gemini call failed (attempt ${attempt}/${maxRetries})`
      );

      if (
        err.message?.includes('403') ||
        err.message?.includes('PERMISSION_DENIED') ||
        err.message?.includes('API key') ||
        err.message?.includes('API_KEY_INVALID') ||
        err.message?.includes('429') ||
        err.message?.includes('RESOURCE_EXHAUSTED') ||
        err.message?.includes('404') ||
        err.message?.includes('503')
      ) {
        logger.warn('Gemini unavailable/quota/auth issue. Falling back to offline generation fixtures.');
        return null;
      }

      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }

  logger.warn(`All ${maxRetries} Gemini attempts failed (${lastError?.message}). Using offline fixture fallback.`);
  return null;
}
