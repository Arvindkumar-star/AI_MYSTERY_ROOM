import mongoose from 'mongoose';

const assetSchema = new mongoose.Schema(
  {
    caseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Case',
      required: true,
      index: true,
    },
    kind: {
      type: String,
      enum: ['portrait', 'evidence_image', 'cctv_frame'],
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
      default: 'image/png',
    },
    data: {
      type: Buffer,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Asset = mongoose.models.Asset || mongoose.model('Asset', assetSchema);

