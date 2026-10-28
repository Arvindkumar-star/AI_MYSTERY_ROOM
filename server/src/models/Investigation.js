import mongoose from 'mongoose';

const boardLinkSchema = new mongoose.Schema(
  {
    evidenceId: { type: String, required: true },
    suspectId: { type: String, required: true },
    note: { type: String, default: null },
  },
  { _id: false }
);

const hintLogSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const accusationSchema = new mongoose.Schema(
  {
    suspectId: { type: String, required: true },
    theory: { type: String, default: '' },
    correct: { type: Boolean, required: true },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const investigationSchema = new mongoose.Schema(
  {
    caseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Case',
      required: true,
      index: true,
    },
    playerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'solved', 'failed', 'abandoned'],
      default: 'active',
      index: true,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    endedAt: {
      type: Date,
      default: null,
    },
    viewedEvidenceIds: {
      type: [String],
      default: [],
    },
    pinnedEvidenceIds: {
      type: [String],
      default: [],
    },
    boardLinks: {
      type: [boardLinkSchema],
      default: [],
    },
    notes: {
      type: String,
      default: '',
    },
    hintsUsed: {
      type: Number,
      default: 0,
    },
    hintLog: {
      type: [hintLogSchema],
      default: [],
    },
    accusations: {
      type: [accusationSchema],
      default: [],
    },
    score: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const Investigation =
  mongoose.models.Investigation || mongoose.model('Investigation', investigationSchema);

