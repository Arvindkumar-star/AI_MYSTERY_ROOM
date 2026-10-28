import React, { useState } from 'react';
import { ShieldAlert, AlertTriangle, X, Check, Loader2 } from 'lucide-react';

export default function AccusationModal({
  isOpen,
  onClose,
  suspects = [],
  onSubmitAccusation,
  attemptsRemaining = 1,
  isLoading = false,
}) {
  const [selectedSuspectId, setSelectedSuspectId] = useState(null);
  const [theory, setTheory] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSuspectId || isLoading) return;
    await onSubmitAccusation({ suspectId: selectedSuspectId, theory });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-noir-900 border border-noir-700 w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-noir-800 bg-noir-850 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-red-950/80 border border-red-800 flex items-center justify-center text-red-500">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-paper-50">
                Official Indictment: Accuse Suspect
              </h3>
              <p className="text-[11px] text-zinc-400 font-mono">
                Attempts Remaining: <span className="text-amber font-bold">{attemptsRemaining}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-zinc-500 hover:text-paper-100 transition p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Select Suspect */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 font-bold mb-3">
              1. Select the Culprit
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {suspects.map((suspect) => {
                const isSelected = selectedSuspectId === suspect.suspectId;
                return (
                  <div
                    key={suspect.suspectId}
                    onClick={() => setSelectedSuspectId(suspect.suspectId)}
                    className={`p-3 rounded-lg border cursor-pointer transition flex items-center gap-3 ${
                      isSelected
                        ? 'bg-amber-dim/20 border-amber text-paper-50 ring-1 ring-amber'
                        : 'bg-noir-950 border-noir-800 hover:border-noir-700 text-zinc-300'
                    }`}
                  >
                    <div className="w-9 h-9 rounded bg-noir-900 border border-noir-800 flex items-center justify-center text-xs font-serif font-bold text-amber shrink-0">
                      {suspect.name[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-serif font-bold text-xs truncate">{suspect.name}</p>
                      <p className="text-[11px] text-zinc-400 truncate">{suspect.occupation}</p>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-amber shrink-0" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Theory Textarea */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-bold">
                2. Explain Your Theory (Optional deduction note)
              </label>
              <span className="text-[11px] font-mono text-zinc-500">{theory.length} / 1000</span>
            </div>
            <textarea
              value={theory}
              onChange={(e) => setTheory(e.target.value.slice(0, 1000))}
              placeholder="Outline the motive, opportunity, or physical evidence that proves this suspect is guilty..."
              rows={3}
              className="w-full bg-noir-950 border border-noir-800 rounded-lg p-3 text-xs sm:text-sm text-paper-100 placeholder:text-zinc-600 font-mono focus:border-amber focus:outline-none"
            />
          </div>

          {/* Warning & Confirmation */}
          <div className="p-3 rounded-lg bg-amber-dim/10 border border-amber/30 flex items-start gap-3 text-xs text-amber-glow">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Indictment Caution: </span>
              Submitting an incorrect accusation consumes 1 attempt. Once all attempts are exhausted, the investigation is closed as unsolved.
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-noir-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 rounded text-xs font-medium text-zinc-400 hover:text-paper-100 transition"
            >
              Review Clues More
            </button>
            <button
              type="submit"
              disabled={!selectedSuspectId || isLoading}
              className="px-5 py-2.5 rounded text-xs font-mono font-bold uppercase tracking-wider bg-red-700 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-lg transition flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting Accusation...</span>
                </>
              ) : (
                <span>Formally Accuse</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

