import React from 'react';
import { ListFilter, Clock, Database } from 'lucide-react';

export default function LogViewer({ payload }) {
  if (!payload) return null;

  const { logType = 'System Records', entries = [] } = payload;

  return (
    <div className="h-full overflow-y-auto p-4 flex justify-center items-start">
      <div className="w-full max-w-2xl bg-noir-900 border border-noir-800 shadow-2xl rounded-lg p-6 font-mono text-xs">
        <div className="flex items-center justify-between border-b border-noir-800 pb-3 mb-4">
          <div className="flex items-center gap-2 text-amber">
            <Database className="w-4 h-4" />
            <span className="font-bold uppercase tracking-wider">{logType}</span>
          </div>
          <span className="text-zinc-500">{entries.length} entries recorded</span>
        </div>

        <div className="border border-noir-800 rounded divide-y divide-noir-800/80 bg-noir-950">
          <div className="grid grid-cols-12 gap-2 px-3 py-2 text-[11px] font-bold text-zinc-400 bg-noir-850">
            <span className="col-span-3">TIMESTAMP</span>
            <span className="col-span-3">SOURCE</span>
            <span className="col-span-6">EVENT / LOG ENTRY</span>
          </div>
          {entries.map((entry, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-2 px-3 py-2.5 items-center hover:bg-noir-900 transition">
              <span className="col-span-3 text-zinc-400">{entry.time}</span>
              <span className="col-span-3 text-amber-glow/90 font-semibold truncate">{entry.source}</span>
              <span className="col-span-6 text-paper-100 font-sans text-xs">{entry.entry}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

