import React from 'react';
import { Pin, ArrowRightLeft, User, HelpCircle } from 'lucide-react';

export default function EvidenceBoard({
  suspects = [],
  evidence = [],
  pinnedEvidenceIds = [],
  boardLinks = [],
  onLinkEvidence,
}) {
  const pinnedEvidence = evidence.filter((e) => pinnedEvidenceIds.includes(e.evidenceId));

  const columns = [
    { id: 'unassigned', name: 'Unassigned Clues', isUnassigned: true },
    ...suspects.map((s) => ({ id: s.suspectId, name: s.name, suspect: s })),
  ];

  const getCluesForColumn = (colId) => {
    if (colId === 'unassigned') {
      const assignedIds = new Set(boardLinks.map((bl) => bl.evidenceId));
      return pinnedEvidence.filter((e) => !assignedIds.has(e.evidenceId));
    }
    const linked = boardLinks.filter((bl) => bl.suspectId === colId);
    return linked
      .map((link) => {
        const ev = evidence.find((e) => e.evidenceId === link.evidenceId);
        return ev ? { ...ev, linkNote: link.note } : null;
      })
      .filter(Boolean);
  };

  return (
    <div className="h-full flex flex-col bg-noir-900 border border-noir-800 rounded-lg overflow-hidden shadow-lg">
      <div className="px-4 py-3 bg-noir-850 border-b border-noir-800 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-2 text-paper-100 font-bold uppercase tracking-wider">
          <Pin className="w-4 h-4 text-amber" />
          <span>Evidence Pinboard</span>
        </div>
        <span className="text-zinc-500">{pinnedEvidence.length} pinned clue(s)</span>
      </div>

      {pinnedEvidence.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-zinc-500">
          <Pin className="w-8 h-8 text-noir-700 mb-2" />
          <p className="text-sm">No clues pinned to board yet.</p>
          <p className="text-xs text-zinc-600 mt-1 max-w-xs">
            Click the pin icon beside any evidence in the case file to attach it here.
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto p-4 flex gap-4 items-start">
          {columns.map((col) => {
            const clues = getCluesForColumn(col.id);

            return (
              <div
                key={col.id}
                className="w-64 shrink-0 bg-noir-950/80 border border-noir-800 rounded-lg flex flex-col max-h-full overflow-hidden"
              >
                <div className="p-3 border-b border-noir-800 bg-noir-850 flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-paper-100 truncate flex items-center gap-1.5">
                    {col.isUnassigned ? (
                      <HelpCircle className="w-3.5 h-3.5 text-zinc-400" />
                    ) : (
                      <User className="w-3.5 h-3.5 text-amber" />
                    )}
                    {col.name}
                  </span>
                  <span className="text-[11px] text-zinc-500">({clues.length})</span>
                </div>

                <div className="p-2 space-y-2 overflow-y-auto flex-1">
                  {clues.map((clue) => (
                    <div
                      key={clue.evidenceId}
                      className="p-2.5 rounded bg-noir-900 border border-noir-800 text-xs shadow-sm space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] uppercase text-amber font-bold">
                          {clue.type}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-500">
                          {clue.evidenceId}
                        </span>
                      </div>
                      <p className="font-medium text-paper-100 leading-snug line-clamp-2">
                        {clue.title}
                      </p>

                      {/* Move to suspect selector */}
                      <div className="pt-1.5 border-t border-noir-800/60 flex items-center justify-between">
                        <select
                          value={col.id}
                          onChange={(e) => onLinkEvidence && onLinkEvidence(clue.evidenceId, e.target.value)}
                          className="bg-noir-950 text-[10px] text-zinc-300 border border-noir-700 rounded px-1.5 py-0.5 w-full focus:outline-none"
                        >
                          <option value="unassigned">Unassigned</option>
                          {suspects.map((s) => (
                            <option key={s.suspectId} value={s.suspectId}>
                              Link to: {s.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                  {clues.length === 0 && (
                    <div className="p-4 text-center text-zinc-600 text-[11px] italic">
                      No clues assigned
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

