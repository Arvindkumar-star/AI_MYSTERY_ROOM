# AI Mystery Room

An immersive, AI-powered detective puzzle game built with MERN (MongoDB, Express, React, Node) and Google Gemini.

Every case is generated from a user premise or scenario, validated through an AI "blind solver" for fair deductive solvability, and solved through clues, WhatsApp-style chats, CCTV logs, forensics, and suspect interrogation.

---

## Features

- **Solution-First Generative Pipeline:** Decides the culprit, motive, method, and 24-hour timeline first, then generates clues designed to conclusively point to the truth.
- **Fair Solvability Verification:** A blind detective model verifies that the evidence is sufficient to deductively catch the culprit with $\ge 60\%$ confidence before the case is playable.
- **Strict Anti-Spoiler Guarantee:** Server-side allow-list serialization guarantees no culprit identities, motives, or prompt data ever reach the client until the investigation is resolved.
- **Type-Specific Evidence Viewers:**
  - **Chat:** Simulated messaging app interface with timestamps, status ticks, and deleted message markers.
  - **Document:** Styled official records, wills, letters, and receipts with confidential stamps.
  - **Statement:** Transcripts of witness and suspect statements with reliability notes.
  - **CCTV Simulation:** Dark surveillance monitor with CRT scanlines, REC indicator, live timestamp, and scrubbable timeline slider.
  - **Forensics & Logs:** Autopsy, fingerprint, toxicology, and electronic access logs.
- **Interactive Detective Tools:**
  - Auto-saving notebook for tracking deductions.
  - Suspect-linked Evidence Pinboard.
  - Contextual hints that nudge without spoiling the culprit.
  - Formal accusation and indictment mechanics with attempt counters.
  - Comprehensive reveal breakdown and scoring engine.

---

## Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS, TanStack Query, Zustand, Framer Motion, Lucide Icons.
- **Backend:** Node.js 20 LTS, Express 4 (ES modules), Mongoose 8.
- **AI Integration:** Google Gemini API (`@google/genai`).
- **Testing:** Vitest, Supertest.
- **Security:** Helmet, CORS, Express Rate Limit, Express Mongo Sanitize, httpOnly cookies.

---

## Getting Started

### Prerequisites

- Node.js 20+ installed
- MongoDB (optional for local dev: automatically falls back to in-memory MongoDB if standalone instance is not running)
- Gemini API Key from [Google AI Studio](https://aistudio.google.com/)

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd AI_mysteryRoom

# Install all workspace dependencies
npm install
```

### Environment Configuration

Copy `.env.example` to `server/.env` and `client/.env`:

```bash
# Server configuration (server/.env)
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ai-mystery-room
CLIENT_ORIGIN=http://localhost:5173
COOKIE_SECRET=change-me-to-a-secure-secret-key

# Gemini AI API Configuration
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_TEXT_MODEL=gemini-3.5-flash-lite
GEMINI_REASONING_MODEL=gemini-3.5-flash-lite
GEMINI_IMAGE_MODEL=gemini-2.5-flash-image
GEMINI_TIMEOUT_MS=60000
MAX_IMAGES_PER_CASE=6

# Client configuration (client/.env)
VITE_API_BASE_URL=http://localhost:5000/api
```

### Running Locally

```bash
# Start both server and client concurrently
npm run dev

# Or run separately:
npm run dev --workspace=server # Starts API at http://localhost:5000
npm run dev --workspace=client # Starts Vite dev server at http://localhost:5173
```

---

## Running Tests

The test suite validates all 8 spec milestones:

```bash
# Run all server tests
npm test

# Run individual milestone test suites:
npm test -- --run tests/m1.health.test.js      # Milestone 1: Foundation & Session
npm test -- --run tests/m2.spoiler.test.js     # Milestone 2: Anti-Spoiler Invariants
npm test -- --run tests/m3.pipeline.test.js    # Milestone 3: AI Generation Pipeline
npm test -- --run tests/m5_m7.gameplay.test.js # Milestones 5 & 7: Accusation, Scoring, Hints
```

---

## Architecture & Directory Structure

```
ai-mystery-room/
├─ package.json                 # Monorepo workspace configuration
├─ .env.example
├─ docs/
│  ├─ SPEC.md                   # Full product & technical specification
│  └─ DECISIONS.md              # Architectural decisions (ADRs)
├─ server/
│  ├─ src/
│  │  ├─ index.js               # Bootstrap & graceful recovery
│  │  ├─ app.js                 # Express application & middleware
│  │  ├─ config/env.js          # Zod environment validation
│  │  ├─ db/connect.js          # MongoDB connection + in-memory fallback
│  │  ├─ models/                # Case, Player, Investigation, Asset
│  │  ├─ routes/                # cases, investigations, assets, health
│  │  ├─ services/              # gemini pipeline, sanitizer, scoring, accusation
│  │  ├─ middleware/            # playerSession, rateLimit, errorHandler
│  │  └─ utils/                 # logger
│  └─ tests/                    # Vitest test suites & sampleCase fixtures
└─ client/
   ├─ src/
   │  ├─ api/                   # API client fetch wrapper
   │  ├─ pages/                 # Landing, Generating, Briefing, Investigation, Verdict, History
   │  ├─ components/
   │  │  ├─ evidence/           # Chat, Document, Statement, CCTV, Forensic, Log, Image
   │  │  ├─ suspects/           # SuspectCard, SuspectList
   │  │  ├─ board/              # EvidenceBoard
   │  │  ├─ notebook/           # Auto-saving Notebook
   │  │  └─ ui/                 # AccusationModal
   │  └─ store/                 # Zustand store
   └─ index.html
```

---

## License

MIT. Created for AI Mystery Room. All case content generated is fictional.

