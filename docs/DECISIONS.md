# Architectural Decisions Record

## ADR-001: Automatic Local In-Memory MongoDB Fallback for Development and Testing
- **Context:** Developers or test environments might not have a standalone MongoDB daemon or Docker running locally.
- **Decision:** When `MONGODB_URI` is not set or local connection fails in development/test, server can spin up `mongodb-memory-server` seamlessly. In production (`NODE_ENV=production`), a valid `MONGODB_URI` is strictly required.
- **Status:** Accepted.

## ADR-002: Structured Gemini Output via Zod & JSON Mode
- **Context:** AI generation must be reliable, deterministic, and validated before storage.
- **Decision:** Use Google Gen AI SDK (`@google/genai`) with `responseMimeType: application/json` and validate each response strictly with Zod schemas.

## ADR-003: Allow-list Serialization for Anti-Spoiler Protection
- **Context:** The mystery solution (culprit, motive, method, key evidence, red herring explanations) must never reach the client before a case is resolved.
- **Decision:** Never rely on field deletion or exclude lists. Instead, `caseSanitizer.js` constructs safe client-facing DTOs using explicit allow-lists only.

