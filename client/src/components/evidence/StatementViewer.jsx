import React from 'react';
import { UserCheck, Clock, AlertTriangle, Quote } from 'lucide-react';

export default function StatementViewer({ payload }) {
  if (!payload) return null;

  const {
    speakerName = 'Unknown',
    speakerRole = 'witness',
    takenAt = '',
    transcript = '',
    reliabilityNote = '',
  } = payload;

  const roleColors = {
    suspect: 'bg-red-950/60 text-red-400 border-red-800/60',
    witness: 'bg-blue-950/60 text-blue-400 border-blue-800/60',
    officer: 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60',
  };

  return (
    <div className="h-full overflow-y-auto p-4 flex justify-center items-start">
      <div className="w-full max-w-2xl bg-noir-900 border border-noir-800 shadow-2xl rounded-lg p-6 sm:p-8">
        {/* Header Badge & Meta */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-noir-800 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-noir-800 border border-noir-700 flex items-center justify-center text-amber">
              <Quote className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-paper-100">{speakerName}</h3>
              <p className="text-xs text-zinc-400 flex items-center gap-1.5 mt-0.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Recorded: {takenAt ? new Date(takenAt).toLocaleString() : 'Undisclosed time'}</span>
              </p>
            </div>
          </div>
          <span
            className={`px-3 py-1 rounded text-xs uppercase font-mono font-bold tracking-wider border ${
              roleColors[speakerRole] || roleColors.witness
            }`}
          >
            {speakerRole}
          </span>
        </div>

        {/* Transcript Body */}
        <div className="relative bg-noir-950/70 border border-noir-800/80 rounded p-6 text-paper-100 font-serif leading-relaxed text-sm sm:text-base italic">
          <Quote className="w-8 h-8 text-noir-700 absolute -top-3 -left-3" />
          "{transcript}"
        </div>

        {/* Reliability Note */}
        {reliabilityNote && (
          <div className="mt-6 flex items-start gap-3 bg-amber-dim/10 border border-amber/30 rounded p-3 text-xs text-amber-glow">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Investigator Note on Reliability: </span>
              <span>{reliabilityNote}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

