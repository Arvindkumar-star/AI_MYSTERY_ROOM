import mongoose from 'mongoose';

const playerSchema = new mongoose.Schema(
  {
    anonId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    displayName: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const Player = mongoose.models.Player || mongoose.model('Player', playerSchema);

