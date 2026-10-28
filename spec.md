# AI Mystery Room: Product & Technical Specification

**Version:** 1.0 | **Status:** Source of truth for build | **Target builder:** Google Antigravity (agentic IDE) | **Stack:** MERN + Google Gemini

---

## 0. How to Use This Document

This document is the single source of truth. If code, comments, or assumptions conflict with it, this document wins. Where a decision is not specified, choose the simplest option consistent with this spec and record it in `/docs/DECISIONS.md`.

**Rules for the building agent**

1. Build in the milestone order in Section 18. Do not start a milestone until the previous one passes its acceptance checks.
2. The solution (culprit, motive, key clues) must **never** reach the client before a case is resolved. This is the most important invariant in the system (Section 11.1).
3. All Gemini output must be requested as structured JSON and validated with a schema before it is saved. Never trust raw model text.
4. Never hard-code API keys or model names. Use environment variables (Section 16).
5. Model names and SDK details change often. Verify the current Gemini model IDs and SDK usage against the official Gemini API docs before coding, and keep them configurable.

---

## 1. Product Summary

AI Mystery Room is a web app where a user types a short scenario, story, or premise and receives a fully playable, AI-generated detective case. The case contains a crime or mysterious incident, several suspects, one culprit, and a body of evidence: WhatsApp-style chats, images, CCTV simulations, witness statements, documents, and more. The user investigates, forms a theory, accuses a suspect, and then sees whether they were right along with a full explanation of the solution.

**Core promise:** every case is generated from the user's own input, is internally consistent, and is **fairly solvable** by deduction from the evidence alone.

### 1.1 Goals

- Turn a one-paragraph prompt into a playable mystery in roughly 30-90 seconds.
- Make the culprit deducible from evidence, with a unique correct answer.
- Provide an immersive, evidence-board style investigation UI.
- Reveal a clear, evidence-linked explanation after the accusation.

### 1.2 Non-Goals (MVP)

- Multiplayer or real-time collaboration.
- Real video generation (CCTV is simulated, see Section 9.4).
- Native mobile apps (the web app must be responsive, nothing more).
- Payments or subscriptions.
- Social feeds or public case sharing (a read-only share link is a stretch goal).

---

## 2. Users and Primary Flow

**Persona:** casual puzzle and mystery fans who want a quick, replayable detective experience. No account is required to play in the MVP.

**Primary flow**

1. **Landing:** user sees the pitch and a prompt box. They enter a premise, choose difficulty and tone, and click **Open Case**.
2. **Generation:** a progress screen shows stages (Building the crime > Creating suspects > Forging evidence > Verifying solvability > Rendering visuals).
3. **Case Briefing:** title, setting, victim or incident summary, suspect line-up, and a Start Investigation button.
4. **Investigation:** user browses evidence, reads suspect profiles, takes notes, pins clues to a board, and may request a limited number of hints.
5. **Accusation:** user selects a suspect and writes a short theory (motive, method, key evidence).
6. **Verdict & Reveal:** correct or incorrect, the true culprit, motive, method, timeline, and the evidence chain. Score is shown.
7. **Replay options:** Play Again (new premise), Retry (same case, if attempts remain), or View Case File.

---

## 3. Functional Requirements

| ID | Requirement | Priority |
|---|---|---|
| F1 | Accept a premise (20-1000 chars) plus difficulty (easy/medium/hard) and tone (classic/noir/cozy/thriller/sci-fi). | P0 |
| F2 | Generate a complete case via Gemini: incident, setting, victim, 4-6 suspects, one culprit, timeline, evidence, red herrings. | P0 |
| F3 | Validate case structure and run a solvability verification pass before the case is playable. | P0 |
| F4 | Display evidence by type with type-specific viewers (chat, document, image, CCTV, statement, forensic). | P0 |
| F5 | Suspect profiles with relationship to victim, alibi claim, and statement. | P0 |
| F6 | Notebook: free-text notes per case, persisted. | P0 |
| F7 | Clue pinning: user can mark evidence as important and link evidence to suspects on an Evidence Board. | P1 |
| F8 | Accusation endpoint with attempts limited by difficulty. | P0 |
| F9 | Reveal screen with explanation and evidence chain. | P0 |
| F10 | Hint system (max 3 per case) that nudges without revealing the culprit. | P1 |
| F11 | Scoring (Section 12). | P1 |
| F12 | Case history for the current anonymous player (list of past cases). | P1 |
| F13 | Suspect interrogation chat powered by Gemini (max 5 questions per suspect). | P2 stretch |
| F14 | Read-only share link of a resolved case. | P2 stretch |
| F15 | Accounts (email/Google login). | P2 stretch |

**Difficulty rules**

| Difficulty | Suspects | Evidence items | Red herrings | Attempts | Hints |
|---|---|---|---|---|---|
| easy | 4 | 8-10 | 1-2 | 3 | 3 |
| medium | 5 | 11-14 | 3-4 | 2 | 3 |
| hard | 6 | 14-18 | 5-6 | 1 | 2 |

---

## 4. Tech Stack

| Layer | Choice |
|---|---|
| Frontend | React 18 + Vite, React Router v6, TanStack Query for server state, Zustand for local UI state, Tailwind CSS, Framer Motion for subtle transitions |
| Backend | Node.js 20 LTS, Express 4, ES modules |
| Database | MongoDB (Atlas or local) via Mongoose 8 |
| AI | Google Gemini via the official `@google/genai` SDK (server-side only) |
| Validation | Zod (shared schemas for AI output and API input) |
| Security | helmet, cors, express-rate-limit, express-mongo-sanitize |
| Logging | pino |
| Testing | Vitest (unit), Supertest (API), Playwright (e2e smoke) |
| Tooling | ESLint, Prettier, dotenv, concurrently |

**Rule:** the Gemini API key lives only on the server. The browser never calls Gemini directly.

---

## 5. Repository Structure

```
ai-mystery-room/
├─ package.json                 # root scripts: dev, build, test, lint
├─ .env.example
├─ docs/
│  ├─ SPEC.md                   # copy of this document
│  └─ DECISIONS.md
├─ server/
│  ├─ src/
│  │  ├─ index.js               # bootstrap
│  │  ├─ app.js                 # express app, middleware
│  │  ├─ config/env.js          # validated env (zod)
│  │  ├─ db/connect.js
│  │  ├─ models/                # Case.js, Player.js, Investigation.js, Asset.js
│  │  ├─ routes/                # cases.routes.js, investigations.routes.js, assets.routes.js, health.routes.js
│  │  ├─ controllers/
│  │  ├─ services/
│  │  │  ├─ gemini/
│  │  │  │  ├─ client.js        # SDK wrapper, retries, timeouts
│  │  │  │  ├─ prompts/         # blueprint.js, evidence.js, verify.js, hint.js, image.js
│  │  │  │  └─ schemas/         # zod + JSON schemas for AI output
│  │  │  ├─ caseGenerator.js    # orchestration pipeline
│  │  │  ├─ caseSanitizer.js    # strips solution for client
│  │  │  ├─ accusation.service.js
│  │  │  ├─ scoring.service.js
│  │  │  └─ moderation.service.js
│  │  ├─ middleware/            # playerSession, rateLimit, errorHandler, validate
│  │  └─ utils/
│  └─ tests/
└─ client/
   ├─ src/
   │  ├─ main.jsx, App.jsx
   │  ├─ api/                   # fetch wrappers + react-query hooks
   │  ├─ pages/                 # Landing, Generating, Briefing, Investigation, Verdict, History
   │  ├─ components/
   │  │  ├─ evidence/           # ChatViewer, DocumentViewer, ImageViewer, CctvViewer, StatementViewer, ForensicViewer
   │  │  ├─ suspects/
   │  │  ├─ board/
   │  │  ├─ notebook/
   │  │  └─ ui/
   │  ├─ store/                 # zustand stores
   │  └─ styles/
   └─ index.html
```

---

## 6. System Architecture

```
Browser (React) --HTTPS/JSON--> Express API --> MongoDB
                                   |
                                   +--> Gemini API (text + image)
```

- The API creates a case record immediately with `status: "generating"` and returns its ID. Generation runs asynchronously in the same Node process (an in-process job; no queue needed for MVP). The client polls `GET /api/cases/:id/status` every 2 seconds.
- Text generation finishes first and flips the case to `status: "ready"` so the user can start playing. Image assets generate afterwards in the background; each image evidence item has `assetStatus` (`pending`, `ready`, `failed`) and the UI shows a placeholder until ready.
- Players are anonymous. A `playerId` (UUID) is issued as an httpOnly cookie on first visit and stored in a `Player` document. All cases and investigations are scoped to it.

---

## 7. Data Models (Mongoose)

All schemas use `timestamps: true`. IDs exposed to clients are string versions of `_id`, except `suspectId` and `evidenceId`, which are short stable strings generated by the system (e.g. `s1`, `e7`).

### 7.1 Player

```js
{ _id, anonId: String (uuid, unique, indexed), displayName: String?, createdAt }
```

### 7.2 Case

```js
{
  _id,
  playerId: ObjectId (ref Player, indexed),
  premise: String,                 // user input (sanitized)
  difficulty: 'easy'|'medium'|'hard',
  tone: 'classic'|'noir'|'cozy'|'thriller'|'scifi',
  status: 'generating'|'ready'|'failed',
  generationStage: String,         // blueprint|evidence|verify|images|done
  generationError: String?,
  title: String,
  setting: { place: String, era: String, atmosphere: String },
  incident: { summary: String, occurredAt: String, location: String, victimName: String? },
  suspects: [{
    suspectId: String,
    name: String, age: Number, occupation: String,
    relationToVictim: String,
    personality: String,
    claimedAlibi: String,
    statement: String,             // their formal statement
    portraitPrompt: String,        // internal, for image gen
    portraitAssetId: ObjectId?
  }],
  evidence: [{
    evidenceId: String,
    type: 'chat'|'document'|'image'|'cctv'|'statement'|'forensic'|'audio_transcript'|'log',
    title: String,
    description: String,           // short caption shown in list
    discoveredAt: String,          // in-world time/place found
    isRedHerring: Boolean,         // STRIPPED from client payload
    payload: Mixed,                // type-specific, see Section 9
    assetId: ObjectId?,
    assetStatus: 'none'|'pending'|'ready'|'failed'
  }],
  solution: {                      // select: false. NEVER sent to client until resolved
    culpritId: String,
    motive: String,
    method: String,
    opportunity: String,
    timeline: [{ time: String, event: String }],
    keyEvidenceIds: [String],
    redHerringExplanations: [{ evidenceId: String, explanation: String }],
    fullExplanation: String
  },
  verification: { passed: Boolean, solverAnswerId: String, notes: String, attempts: Number },
  model: { textModel: String, imageModel: String }
}
```

### 7.3 Investigation (one play-through of a case)

```js
{
  _id, caseId: ObjectId, playerId: ObjectId,
  status: 'active'|'solved'|'failed'|'abandoned',
  startedAt, endedAt?,
  viewedEvidenceIds: [String],
  pinnedEvidenceIds: [String],
  boardLinks: [{ evidenceId: String, suspectId: String, note: String? }],
  notes: String,
  hintsUsed: Number,
  hintLog: [{ text: String, at: Date }],
  accusations: [{ suspectId: String, theory: String, correct: Boolean, at: Date }],
  score: Number?
}
```

### 7.4 Asset

```js
{ _id, caseId, kind: 'portrait'|'evidence_image'|'cctv_frame', mimeType, data: Buffer, size: Number }
```

MVP stores images as Buffers in MongoDB (keep each under 1 MB; compress to WebP with `sharp` if larger). Serve via `GET /api/assets/:id` with long-lived cache headers. Isolate behind a storage interface so S3 or GCS can replace it later.

---

## 8. AI Generation Pipeline (Gemini)

The pipeline is **solution-first**: decide the truth, then build evidence that supports it. This is what makes cases fair.

### 8.1 Stages

| Stage | Purpose | Output |
|---|---|---|
| 0. Moderate | Screen the premise (Section 14.3). | allow / reject with reason |
| 1. Blueprint | Create the incident, setting, suspects, culprit, motive, method, true timeline, and a list of clue plan items (what each evidence item must establish). | Blueprint JSON |
| 2. Evidence | For each planned item, generate the type-specific payload. Run in parallel batches of 4. | Evidence JSON per item |
| 3. Verify | A separate "blind detective" call receives only the player-visible data (no solution) and must name the culprit with reasoning. | solverAnswerId + reasoning |
| 4. Repair | If the blind solver is wrong or uncertain, regenerate or strengthen 1-2 weakest evidence items and re-verify. Max 2 repair loops, then fail the case with a retryable error. | Updated evidence |
| 5. Persist | Save case, set `status: ready`. | Case document |
| 6. Images | Generate portraits and image evidence asynchronously. | Assets |

### 8.2 Structured Output Requirement

Every Gemini call uses JSON mode (`responseMimeType: application/json`) with a `responseSchema`, then is parsed and validated with Zod. On validation failure, retry once with the validation error appended to the prompt; on a second failure, fail the stage. Wrap calls with a 60-second timeout and exponential backoff (3 tries) for 429 and 5xx errors.

### 8.3 Blueprint Prompt Contract

The system instruction must enforce:

- Everything is fiction. No real people, brands in defamatory context, or real crimes.
- Exactly one culprit, who is **not** the most obvious suspect.
- Each non-culprit suspect has a plausible motive and at least one verifiable alibi or exculpatory clue somewhere in the evidence.
- At least three independent clues point to the culprit; no single clue is decisive alone, but together they are conclusive.
- Red herrings count follows the difficulty table, and each must be explainable.
- All names, times, places, and facts must be mutually consistent. Use a single 24-hour timeline.
- Tone and setting follow the user's premise and chosen tone.
- Output language matches the language of the premise (default English).

Blueprint output shape (abridged):

```json
{
  "title": "", "setting": {}, "incident": {},
  "suspects": [{ "suspectId": "s1", "name": "", "...": "" }],
  "solution": { "culpritId": "s3", "motive": "", "method": "", "opportunity": "", "timeline": [] },
  "cluePlan": [
    { "evidenceId": "e1", "type": "chat", "purpose": "Shows s3 lied about being home", "pointsTo": "s3", "isRedHerring": false, "clueStrength": "supporting" }
  ]
}
```

### 8.4 Evidence Prompt Contract

Each evidence call receives the blueprint (including the solution, since this is a server-only call) and one `cluePlan` item, and returns only that item's payload. Rules: embed the clue naturally and subtly; never state the culprit's name as the guilty party; keep dialogue realistic (slang, typos, emojis in chats); keep timestamps consistent with the true timeline; red herrings must look suspicious but be disprovable.

### 8.5 Blind Solver (Verification)

Input is the sanitized case exactly as the client would see it. Output:

```json
{ "culpritId": "s3", "confidence": 0.0, "reasoning": "", "evidenceUsed": ["e1","e4","e9"] }
```

Pass condition: `culpritId` equals the blueprint culprit and `confidence >= 0.6`. Store the result in `verification`.

### 8.6 Hints

`POST /api/investigations/:id/hint` calls Gemini with the full case and the player's notes, and must return a nudge that points toward a **category of evidence or a contradiction to examine**, never a name. Hint text is validated server-side: reject and regenerate if it contains the culprit's name or ID.

### 8.7 Image Generation

- Use the configured Gemini image model (`GEMINI_IMAGE_MODEL`).
- Style prompt prefix by tone, e.g. noir: "grainy black-and-white photograph, high contrast, 1940s". Always append: "No text overlays, no real people, no logos."
- Portraits: one per suspect, bust shot, consistent style across the case.
- Evidence images (crime scene photo, photographed object, surveillance still): 1 per `image` or `cctv` keyframe, maximum 6 images per case to control cost.
- Any text that must appear in an image (a note, a receipt) is rendered by the **frontend as HTML** over or beside the image, not by the model, because image models render text unreliably.
- On failure, set `assetStatus: failed` and show a styled placeholder with the evidence's text description. The case must remain fully solvable without any image.

---

## 9. Evidence Types and Payload Schemas

Every evidence item always includes a text description sufficient to extract its clue, so images are never required for solvability.

### 9.1 `chat`: WhatsApp-style conversation

```json
{ "app": "whatsapp", "isGroup": false, "participants": [{ "name": "", "suspectId": "s2" }],
  "messages": [{ "sender": "", "text": "", "timestamp": "2025-03-14T21:42:00", "status": "read", "deleted": false }] }
```

UI: green and white bubbles, date separators, read ticks, deleted-message placeholder ("This message was deleted"), group name header. Must not use WhatsApp logos or trademarked assets; use a generic "Chat" styling inspired by messaging apps.

### 9.2 `document`

```json
{ "docType": "email|receipt|contract|letter|invoice|report|note", "header": {}, "bodyMarkdown": "", "footer": "" }
```

UI: paper-styled card with monospace or serif font depending on `docType`, optional "stamped" overlay.

### 9.3 `statement`: witness or suspect statement

```json
{ "speakerName": "", "speakerRole": "witness|suspect|officer", "takenAt": "", "transcript": "", "reliabilityNote": "" }
```

### 9.4 `cctv`: camera-recording simulation

No real video. A CCTV item is a **timeline of events** rendered in a surveillance-style viewer.

```json
{ "cameraId": "CAM-03", "location": "", "date": "2025-03-14",
  "events": [{ "time": "21:38:12", "description": "Figure in dark coat enters frame left", "suspectId": "s3|null", "keyframeAssetId": "optional" }],
  "gaps": [{ "from": "21:51:00", "to": "22:04:00", "reason": "Feed interrupted" }] }
```

UI: dark viewer with scanlines, a REC indicator, a live timestamp overlay, a scrubbable timeline slider that reveals event captions as the playhead moves, and optional AI keyframe stills shown at their timestamps. Gaps appear as "SIGNAL LOST" segments.

### 9.5 `image`

```json
{ "caption": "", "imagePrompt": "", "altText": "", "annotations": [{ "label": "", "x": 0.4, "y": 0.6 }] }
```

### 9.6 `forensic`: lab or medical report

```json
{ "reportType": "autopsy|fingerprint|toxicology|digital|ballistics", "findings": [{ "label": "", "value": "" }], "conclusion": "" }
```

### 9.7 `log` and `audio_transcript`

Structured rows (`time`, `source`, `entry`) for phone, door-access, or search logs; speaker-labelled transcript for voice notes and calls.

---

## 10. REST API

Base path `/api`. JSON in and out. All responses: `{ "ok": true, "data": ... }` or `{ "ok": false, "error": { "code": "", "message": "" } }`.

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Liveness and DB check. |
| POST | `/cases` | Body: `{ premise, difficulty, tone }`. Creates case, starts generation. Returns `{ caseId }` (202). |
| GET | `/cases/:id/status` | Returns `{ status, generationStage, progress, error? }`. |
| GET | `/cases/:id` | Sanitized case (no solution, no `isRedHerring`, no `portraitPrompt` or `imagePrompt`). Only if `status` is `ready`. |
| GET | `/cases` | Current player's cases (id, title, status, createdAt, result). |
| POST | `/cases/:id/investigations` | Starts an investigation. Returns the investigation. |
| GET | `/investigations/:id` | Current state, including saved notes and board. |
| PATCH | `/investigations/:id` | Update `notes`, `viewedEvidenceIds`, `pinnedEvidenceIds`, `boardLinks`. |
| POST | `/investigations/:id/hint` | Returns a hint; increments `hintsUsed`; enforces limit. |
| POST | `/investigations/:id/accuse` | Body: `{ suspectId, theory }`. Returns verdict; on final result includes the reveal payload. |
| GET | `/investigations/:id/reveal` | Reveal payload; only if investigation is `solved` or `failed`. |
| GET | `/assets/:id` | Image bytes; must belong to a case the player owns. |
| POST | `/cases/:id/retry-generation` | Re-run a failed generation (max 2). |

### 10.1 Accuse response

```json
{ "correct": true, "attemptsRemaining": 0, "investigationStatus": "solved",
  "reveal": { "culpritId": "", "motive": "", "method": "", "opportunity": "", "timeline": [], "keyEvidence": [{ "evidenceId": "", "why": "" }], "redHerrings": [{ "evidenceId": "", "explanation": "" }], "fullExplanation": "", "scoreBreakdown": {} } }
```

If incorrect and attempts remain, return `{ correct: false, attemptsRemaining: n }` with **no reveal and no hint about the real culprit**. When attempts hit zero, set status `failed` and include the reveal.

---

## 11. Game Logic

### 11.1 Anti-Spoiler Invariants (critical)

1. `Case.solution` is `select: false` and only loaded inside `accusation.service`, the hint service, and reveal.
2. The sanitizer (`caseSanitizer.js`) builds the client payload from an **allow-list**, not a deny-list.
3. `isRedHerring`, `portraitPrompt`, `imagePrompt`, and `verification` are never serialized to clients.
4. Reveal endpoints check investigation status server-side. Tests must assert that every pre-resolution endpoint response contains none of: culprit ID, motive text, `fullExplanation`.
5. Do not log solutions at `info` level.

### 11.2 Accusation Rules

- A suspect ID must exist in the case. Theory text is capped at 1000 chars and is stored but **does not affect correctness** in the MVP (correctness = suspect match).
- Attempts per difficulty are in Section 3. Re-accusing the same wrong suspect does not consume an extra attempt.
- After the investigation ends, further accusations return `409`.

---

## 12. Scoring (P1)

```
score = 1000 (correct)
      - 200 x (wrong attempts)
      - 75 x (hints used)
      - timePenalty            // 1 point per 30 s beyond 10 min, max 200
      + 10 x (key evidence items the player viewed)   // max 100
      + 50 x (theory mentions the true motive keyword match, optional AI-graded bonus)
```

Incorrect final result scores 0 but still shows the key-evidence checklist. Show a simple rank label (Rookie, Detective, Inspector, Master Sleuth).

---

## 13. Frontend Specification

### 13.1 Pages and Routes

| Route | Page | Key elements |
|---|---|---|
| `/` | Landing | Hero, prompt textarea (with character counter), difficulty and tone selectors, 3 example premises (click to fill), Open Case button, recent cases. |
| `/case/:id/generating` | Generating | Animated stage list, poll status, error state with Retry. |
| `/case/:id` | Briefing | Title, atmosphere, incident summary, suspect cards, Start Investigation. |
| `/investigation/:id` | Investigation | Three-pane layout (see 13.2). |
| `/investigation/:id/verdict` | Verdict | Result banner, reveal, evidence chain, score, replay actions. |
| `/history` | History | Past cases and results. |

### 13.2 Investigation Layout

- **Left rail:** evidence list grouped by type, with icons, "new" dot for unviewed, and a pin toggle. Filter and search box.
- **Center:** active evidence viewer (type-specific component from Section 9).
- **Right rail:** tabs for **Suspects**, **Notebook**, **Board**, **Hints**.
- **Top bar:** case title, hints used, attempts remaining, and a prominent **Make Accusation** button.
- Mobile: left rail becomes a drawer; right rail becomes bottom sheet tabs.

### 13.3 Evidence Board (P1)

A simple column board: one column per suspect plus an "Unassigned" column. The user drags pinned evidence cards into a suspect column and may add a one-line note. Persist through `PATCH /investigations/:id` with debounce (800 ms). No free-form canvas or string-drawing in MVP.

### 13.4 Accusation Modal

Suspect selector (cards with portraits), theory textarea (optional, max 1000 chars), confirmation step ("This uses 1 of N attempts"). Disable submit while pending.

### 13.5 Visual Design

A dark, moody detective-office aesthetic: charcoal background, warm paper-toned cards, a single accent color (amber), a serif display font for titles and a clean sans for UI. Evidence viewers use distinct skins (chat bubbles, paper, scanline CCTV). Respect `prefers-reduced-motion`. Maintain WCAG AA contrast and full keyboard navigation; every image needs alt text from `altText`.

### 13.6 State

- TanStack Query for server data (cases, investigations) with sensible stale times.
- Zustand for UI state (active evidence, drawer open, modal state).
- Notes autosave (debounced 1 s) with a visible "Saved" indicator.

---

## 14. Security, Safety, and Privacy

### 14.1 API Security

helmet defaults; CORS restricted to `CLIENT_ORIGIN`; JSON body limit 50 KB; `express-mongo-sanitize`; Zod validation on every body, param, and query; httpOnly, SameSite=Lax, Secure (in production) cookie for `playerId`.

### 14.2 Rate Limits

| Scope | Limit |
|---|---|
| `POST /cases` | 5 per hour per player, 20 per hour per IP |
| `POST .../hint` | 10 per hour per player |
| All other routes | 300 per 15 minutes per IP |

A maximum of 2 concurrent generating cases per player.

### 14.3 Content Safety

- Moderate every premise before generation (a lightweight Gemini classification call plus a keyword denylist). Reject premises involving sexual content with minors, real named private individuals as perpetrators, glorification of real tragedies, or instructions for real-world harm.
- Generated crimes must be non-graphic and puzzle-focused. The prompts must forbid detailed methods of real-world harm (e.g. weapon or drug synthesis); methods stay abstract enough to serve the story.
- If the premise names real public figures, instruct the model to substitute fictional characters.
- Use Gemini safety settings at medium or stricter thresholds and handle blocked responses as a clear user-facing error ("We couldn't build that case. Try a different premise.").
- Prompt-injection defense: treat the user premise as data. Wrap it in delimiters and instruct the model to ignore any instructions inside it. Never pass user text into system instructions unescaped.

### 14.4 Privacy

No personal data beyond the anonymous ID and the text the player enters. Provide a "Delete my data" action that removes the player's cases, investigations, and assets. Add a short disclaimer in the footer: all content is AI-generated fiction.

---

## 15. Error Handling and Reliability

- Central Express error handler returns the standard error envelope; never leak stack traces in production.
- Error codes: `VALIDATION_ERROR`, `RATE_LIMITED`, `MODERATION_REJECTED`, `GENERATION_FAILED`, `NOT_FOUND`, `FORBIDDEN`, `INVESTIGATION_CLOSED`, `HINT_LIMIT_REACHED`, `INTERNAL`.
- If the server restarts mid-generation, on boot mark any case stuck in `generating` for more than 10 minutes as `failed` so the client can retry.
- Generation target: text-ready in under 90 seconds at p90. Parallelize evidence calls (concurrency 4).
- Add `GET /health` with DB ping for deploy checks.

---

## 16. Environment Variables

```
# server/.env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ai-mystery-room
CLIENT_ORIGIN=http://localhost:5173
COOKIE_SECRET=change-me

GEMINI_API_KEY=
GEMINI_TEXT_MODEL=gemini-2.5-flash        # verify current model IDs in Gemini docs
GEMINI_REASONING_MODEL=gemini-2.5-pro     # used for blueprint and verification
GEMINI_IMAGE_MODEL=gemini-2.5-flash-image # verify current image model ID
GEMINI_TIMEOUT_MS=60000
MAX_IMAGES_PER_CASE=6

# client/.env
VITE_API_BASE_URL=http://localhost:5000/api
```

Commit only `.env.example`. Validate env at startup with Zod and fail fast on missing values.

---

## 17. Testing and Acceptance Criteria

### 17.1 Required Tests

- **Unit:** Zod schemas, sanitizer (allow-list), scoring, attempt logic, hint leak check.
- **API (Supertest, with Gemini mocked):** full happy path create > ready > investigate > accuse > reveal; each error code; rate limits.
- **Spoiler test:** iterate every client-facing endpoint before resolution and assert no solution fields are present.
- **Generation fixtures:** a recorded valid blueprint and evidence set so tests run offline.
- **E2E smoke (Playwright, mocked AI):** landing > generate > view each evidence type > accuse > verdict.

### 17.2 Definition of Done (MVP)

1. A user can submit a premise and, within 90 seconds, reach a playable case with at least one evidence item of each of: chat, document, statement, cctv.
2. The blind solver verification passes before a case becomes `ready`.
3. No endpoint leaks solution data before resolution (automated test green).
4. Accusation, attempts, and reveal behave per Sections 10 and 11.
5. Image failures never block play.
6. The UI is usable at 375 px width and at 1440 px width.
7. Lint and tests pass in CI; the app starts with `npm run dev` from the root.

---

## 18. Build Milestones

| # | Milestone | Deliverables | Acceptance |
|---|---|---|---|
| M1 | Foundation | Monorepo, env validation, Express app, Mongo connection, player cookie, health route, Tailwind client shell | `npm run dev` runs both apps; `/health` returns ok |
| M2 | Models and API skeleton | All Mongoose models, Zod schemas, CRUD routes with fixture case, sanitizer | Spoiler test passes using a fixture case |
| M3 | Gemini pipeline | Gemini client wrapper, blueprint, evidence, verify, repair, async job, status polling, moderation | A real premise yields a verified, `ready` case |
| M4 | Core UI | Landing, Generating, Briefing, Investigation with all text-based evidence viewers, notebook | A generated case is fully playable without images |
| M5 | Accusation and reveal | Accuse flow, attempts, verdict page, scoring | Correct and wrong paths verified in e2e |
| M6 | Images and CCTV | Image generation, asset serving, CCTV viewer with keyframes, placeholders | Images appear asynchronously; failures degrade gracefully |
| M7 | Hints, board, history | Hint endpoint with leak check, evidence board, history page | Hint never contains culprit name in tests |
| M8 | Hardening | Rate limits, error pages, a11y pass, responsive polish, README, deployment config | Definition of Done met |

**Stretch (after M8):** suspect interrogation chat (F13), share links (F14), accounts (F15), streaming generation progress via SSE, S3 asset storage.

---

## 19. Assumptions and Open Decisions

- **Anonymous play first.** Accounts are deferred; the `Player` model is designed so accounts can attach later.
- **Polling over WebSockets/SSE** for generation status, for simplicity.
- **In-process async job** instead of a queue; revisit if generation is moved to serverless or multiple instances.
- **Correctness is suspect-match only** in the MVP; theory text is stored for a future AI-graded bonus.
- **Gemini model IDs** are configurable and must be re-verified at build time because they change frequently.
- **Deployment** (not specified): default to Render or Railway for the API, Vercel or Netlify for the client, MongoDB Atlas for the database.

*End of specification.*