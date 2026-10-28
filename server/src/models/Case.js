import mongoose from 'mongoose';

const suspectSubSchema = new mongoose.Schema(
  {
    suspectId: { type: String, required: true },
    name: { type: String, required: true },
    age: { type: Number, required: true },
    occupation: { type: String, required: true },
    relationToVictim: { type: String, required: true },
    personality: { type: String, required: true },
    claimedAlibi: { type: String, required: true },
    statement: { type: String, required: true },
    portraitPrompt: { type: String },
    portraitAssetId: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset', default: null },
  },
  { _id: false }
);

const evidenceSubSchema = new mongoose.Schema(
  {
    evidenceId: { type: String, required: true },
    type: {
      type: String,
      enum: ['chat', 'document', 'image', 'cctv', 'statement', 'forensic', 'audio_transcript', 'log'],
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    discoveredAt: { type: String, required: true },
    isRedHerring: { type: Boolean, required: true, default: false },
    payload: { type: mongoose.Schema.Types.Mixed, required: true },
    assetId: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset', default: null },
    assetStatus: {
      type: String,
      enum: ['none', 'pending', 'ready', 'failed'],
      default: 'none',
    },
  },
  { _id: false }
);

const caseSchema = new mongoose.Schema(
  {
    playerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player',
      required: true,
      index: true,
    },
    premise: { type: String, required: true },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      required: true,
    },
    tone: {
      type: String,
      enum: ['classic', 'noir', 'cozy', 'thriller', 'scifi'],
      required: true,
    },
    status: {
      type: String,
      enum: ['generating', 'ready', 'failed'],
      default: 'generating',
      index: true,
    },
    generationStage: {
      type: String,
      enum: ['moderate', 'blueprint', 'evidence', 'verify', 'repair', 'images', 'done'],
      default: 'blueprint',
    },
    generationError: { type: String, default: null },
    title: { type: String, default: 'Untitled Mystery' },
    setting: {
      place: { type: String, default: '' },
      era: { type: String, default: '' },
      atmosphere: { type: String, default: '' },
    },
    incident: {
      summary: { type: String, default: '' },
      occurredAt: { type: String, default: '' },
      location: { type: String, default: '' },
      victimName: { type: String, default: null },
    },
    suspects: [suspectSubSchema],
    evidence: [evidenceSubSchema],
    // CRITICAL: Section 7.2 & 11.1 - select: false. NEVER sent to client until resolved
    solution: {
      type: {
        culpritId: { type: String },
        motive: { type: String },
        method: { type: String },
        opportunity: { type: String },
        timeline: [
          {
            time: { type: String },
            event: { type: String },
            _id: false,
          },
        ],
        keyEvidenceIds: [{ type: String }],
        redHerringExplanations: [
          {
            evidenceId: { type: String },
            explanation: { type: String },
            _id: false,
          },
        ],
        fullExplanation: { type: String },
      },
      select: false,
      default: null,
    },
    verification: {
      passed: { type: Boolean, default: false },
      solverAnswerId: { type: String, default: null },
      notes: { type: String, default: '' },
      attempts: { type: Number, default: 0 },
    },
    model: {
      textModel: { type: String },
      imageModel: { type: String },
    },
  },
  {
    timestamps: true,
  }
);

export const Case = mongoose.models.Case || mongoose.model('Case', caseSchema);

