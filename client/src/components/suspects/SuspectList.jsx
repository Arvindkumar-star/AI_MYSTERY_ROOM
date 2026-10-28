import React from 'react';
import SuspectCard from './SuspectCard.jsx';
import { Users } from 'lucide-react';

export default function SuspectList({ suspects = [], onSelectSuspect, selectedSuspectId }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs font-mono text-zinc-400 pb-2 border-b border-noir-800">
        <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-amber">
          <Users className="w-4 h-4" /> Suspect Lineup ({suspects.length})
        </span>
        <span>Click to inspect</span>
      </div>
      <div className="space-y-3">
        {suspects.map((suspect) => (
          <SuspectCard
            key={suspect.suspectId}
            suspect={suspect}
            isSelected={selectedSuspectId === suspect.suspectId}
            onSelect={onSelectSuspect}
          />
        ))}
      </div>
    </div>
  );
}

