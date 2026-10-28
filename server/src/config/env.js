import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config(); // fallback to current working directory .env if any

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  MONGODB_URI: z.string().default('mongodb://localhost:27017/ai-mystery-room'),
  CLIENT_ORIGIN: z.string().default('http://localhost:5173'),
  COOKIE_SECRET: z.string().min(8).default('detective-mystery-secret-32-chars-key'),
  // Groq AI Configuration
  GROQ_API_KEY: z.string().optional().default(''),
  GROQ_TEXT_MODEL: z.string().default('openai/gpt-oss-120b'),
  GROQ_REASONING_MODEL: z.string().default('openai/gpt-oss-120b'),
  GROQ_TIMEOUT_MS: z.coerce.number().default(60000),
  // Gemini AI Configuration (fallback/optional)
  GEMINI_API_KEY: z.string().optional().default(''),
  GEMINI_TEXT_MODEL: z.string().default('gemini-2.5-flash'),
  GEMINI_REASONING_MODEL: z.string().default('gemini-2.5-pro'),
  GEMINI_IMAGE_MODEL: z.string().default('gemini-2.5-flash-image'),
  GEMINI_TIMEOUT_MS: z.coerce.number().default(60000),
  MAX_IMAGES_PER_CASE: z.coerce.number().default(6),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Environment validation failed:', parsed.error.format());
  throw new Error('Invalid environment configuration');
}

export const env = parsed.data;
