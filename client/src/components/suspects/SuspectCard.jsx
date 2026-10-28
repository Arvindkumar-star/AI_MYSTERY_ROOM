import React from 'react';
import { User, ShieldAlert, Clock, MessageSquareQuote } from 'lucide-react';

export default function SuspectCard({ suspect, onSelect, isSelected = false }) {
  if (!suspect) return null;

  const {
    suspectId,
    name,
    age,
    occupation,
    relationToVictim,
    personality,
    claimedAlibi,
    statement,
    portraitAssetId,
  } = suspect;

  return (
    <div
      onClick={() => onSelect && onSelect(suspect)}
      className={`p-4 rounded-lg border transition cursor-pointer text-left ${
        isSelected
          ? 'bg-noir-850 border-amber ring-1 ring-amber shadow-lg shadow-amber/10'
          : 'bg-noir-900/90 border-noir-800 hover:border-noir-700 hover:bg-noir-850'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Suspect Portrait / Avatar */}
        <div className="w-12 h-12 rounded bg-noir-950 border border-noir-800 flex items-center justify-center shrink-0 overflow-hidden text-zinc-500">
          {portraitAssetId ? (
            <img
              src={`/api/assets/${portraitAssetId}`}
              alt={name}
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="w-6 h-6 text-noir-600" />
          )}
        </div>

        {/* Suspect Basic Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <h4 className="font-serif font-bold text-sm text-paper-50 truncate">{name}</h4>
            <span className="text-[11px] font-mono text-zinc-500 shrink-0">ID: {suspectId}</span>
          </div>
          <p className="text-xs text-amber-glow/90 font-medium truncate">{occupation}, age {age}</p>
          <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-1">{relationToVictim}</p>
        </div>
      </div>

      {/* Alibi & Statement Details */}
      <div className="mt-3 pt-3 border-t border-noir-800/80 space-y-2 text-xs">
        <div>
          <span className="text-[10px] font-mono uppercase text-zinc-500 font-bold flex items-center gap-1">
            <Clock className="w-3 h-3 text-zinc-400" /> Claimed Alibi
          </span>
          <p className="text-zinc-300 text-[11px] italic mt-0.5">{claimedAlibi}</p>
        </div>
        <div>
          <span className="text-[10px] font-mono uppercase text-zinc-500 font-bold flex items-center gap-1">
            <MessageSquareQuote className="w-3 h-3 text-zinc-400" /> Initial Statement
          </span>
          <p className="text-zinc-400 text-[11px] line-clamp-2 mt-0.5">"{statement}"</p>
        </div>
      </div>
    </div>
  );
}

