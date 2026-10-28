import Groq from 'groq-sdk';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';

let groqClient = null;

export function getGroqClient() {
  if (!groqClient && env.GROQ_API_KEY && env.GROQ_API_KEY.trim() !== '') {
    groqClient = new Groq({ apiKey: env.GROQ_API_KEY });
  }
  return groqClient;
}

/**
 * Strips markdown code blocks and trims content to extract pure JSON.
 */
function cleanJsonResponse(rawText) {
  if (!rawText) return '';
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  }
  return cleaned;
}

/**
 * Executes a Groq request with JSON mode, schema validation, retries, and timeout.
 */
export async function callGroqStructured({
  model = env.GROQ_TEXT_MODEL || 'llama-3.3-70b-versatile',
  systemInstruction,
  prompt,
  schema,
  maxRetries = 3,
  timeoutMs = env.GROQ_TIMEOUT_MS || 60000,
}) {
  // Offline test fixtures support
  if (process.env.NODE_ENV === 'test' || process.env.OFFLINE_AI === 'true') {
    return null;
  }

  const client = getGroqClient();

  if (!client) {
    logger.warn('No GROQ_API_KEY configured. Returning fallback structured response.');
    return null;
  }

  let lastError = null;
  let currentPrompt = prompt;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const messages = [];

      const systemPrompt = systemInstruction
        ? `${systemInstruction}\n\nIMPORTANT: You must output ONLY valid, parsable JSON matching the requested schema.`
        : 'You are an AI assistant. You must output ONLY valid, parsable JSON matching the requested schema.';

      messages.push({ role: 'system', content: systemPrompt });
      messages.push({ role: 'user', content: currentPrompt });

      const completion = await client.chat.completions.create(
        {
          model: model || 'llama-3.3-70b-versatile',
          messages,
          response_format: { type: 'json_object' },
          temperature: 0.7,
        },
        { timeout: timeoutMs }
      );

      const rawContent = completion.choices?.[0]?.message?.content;
      if (!rawContent) {
        throw new Error('Empty response received from Groq');
      }

      const cleanedJson = cleanJsonResponse(rawContent);
      const parsedJson = JSON.parse(cleanedJson);

      if (schema) {
        const validation = schema.safeParse(parsedJson);
        if (!validation.success) {
          logger.warn(
            { attempt, errors: validation.error.format() },
            'Groq output validation failed'
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
        `Groq call failed (attempt ${attempt}/${maxRetries})`
      );

      // Handle unrecoverable errors gracefully (invalid key, rate limits, model errors)
      if (
        err.status === 401 ||
        err.message?.includes('401') ||
        err.message?.includes('Invalid API Key') ||
        err.message?.includes('invalid_api_key') ||
        err.status === 429 ||
        err.message?.includes('429') ||
        err.message?.includes('rate_limit_exceeded') ||
        err.status === 404 ||
        err.status === 503
      ) {
        logger.warn(`Groq API error (${err.message}). Falling back to offline generation fixtures.`);
        return null;
      }

      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }

  logger.warn(`All ${maxRetries} Groq attempts failed (${lastError?.message}). Using fallback fixtures.`);
  return null;
}
