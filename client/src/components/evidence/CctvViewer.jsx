import React, { useState } from 'react';
import { Video, AlertOctagon, Play, Pause, FastForward, RotateCcw } from 'lucide-react';

export default function CctvViewer({ payload, description }) {
  if (!payload) return null;

  const { cameraId = 'CAM-01', location = 'Security Feed', date = '', events = [], gaps = [] } = payload;
  const [currentIndex, setCurrentIndex] = useState(0);

  const activeEvent = events[currentIndex] || events[0];

  return (
    <div className="flex flex-col h-full bg-black text-emerald-400 font-mono rounded-lg overflow-hidden border border-zinc-800 shadow-2xl">
      {/* CCTV Monitor Display */}
      <div className="relative flex-1 bg-zinc-950 flex flex-col justify-between p-6 select-none overflow-hidden">
        {/* CRT Scanline Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.4)_50%)] bg-[length:100%_4px] pointer-events-none z-10 opacity-70"></div>

        {/* Top Monitor Status */}
        <div className="relative z-20 flex justify-between items-center text-xs tracking-wider">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse"></span>
            <span className="font-bold text-red-500">REC</span>
            <span className="text-zinc-400 ml-2">{cameraId}</span>
          </div>
          <div className="text-zinc-400 text-right">
            <span>{date} </span>
            <span className="font-bold text-emerald-400">{activeEvent?.time || '00:00:00'}</span>
          </div>
        </div>

        {/* Center Event Frame */}
        <div className="relative z-20 my-auto py-8 text-center flex flex-col items-center justify-center">
          {activeEvent ? (
            <div className="max-w-lg space-y-3 bg-zinc-900/80 backdrop-blur p-6 rounded border border-emerald-900/60 shadow-lg">
              <div className="text-xs uppercase text-zinc-400 tracking-widest">
                [TIMESTAMP: {activeEvent.time}]
              </div>
              <p className="text-paper-100 text-base font-sans leading-relaxed">
                {activeEvent.description}
              </p>
              {activeEvent.suspectId && (
                <div className="inline-block mt-2 px-2.5 py-0.5 rounded text-[11px] bg-amber-dim/30 text-amber border border-amber/40">
                  Identified Subject ID: {activeEvent.suspectId}
                </div>
              )}
            </div>
          ) : (payload?.bodyMarkdown || description) ? (
            <div className="max-w-lg space-y-3 bg-zinc-900/80 backdrop-blur p-6 rounded border border-emerald-900/60 shadow-lg">
              <div className="text-xs uppercase text-zinc-400 tracking-widest">
                [SURVEILLANCE LOG / OBSERVATION]
              </div>
              <p className="text-paper-100 text-base font-sans leading-relaxed">
                {payload?.bodyMarkdown || description}
              </p>
            </div>
          ) : (
            <div className="text-zinc-600 italic">No event logged at this timestamp</div>
          )}

          {/* Gaps / Signal Loss alert */}
          {gaps.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2 justify-center">
              {gaps.map((gap, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] bg-red-950/70 border border-red-800 text-red-300"
                >
                  <AlertOctagon className="w-3 h-3 text-red-500" />
                  <span>
                    SIGNAL LOST: {gap.from} - {gap.to} ({gap.reason})
                  </span>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Bottom Location Indicator */}
        <div className="relative z-20 flex justify-between text-[11px] text-zinc-500">
          <span>LOC: {location}</span>
          <span>FRAME: {currentIndex + 1} / {events.length || 1}</span>
        </div>
      </div>

      {/* Scrubbable Timeline Controls */}
      <div className="bg-noir-900 border-t border-noir-800 p-4">
        <div className="flex items-center gap-3">
          <input
            type="range"
            min="0"
            max={Math.max(0, events.length - 1)}
            value={currentIndex}
            onChange={(e) => setCurrentIndex(Number(e.target.value))}
            className="w-full accent-amber h-2 bg-noir-800 rounded cursor-pointer"
          />
        </div>
        <div className="flex justify-between items-center text-xs text-zinc-400 mt-2">
          <span>{events[0]?.time || 'Start'}</span>
          <span className="text-amber font-mono">Scrub timeline to inspect timestamps</span>
          <span>{events[events.length - 1]?.time || 'End'}</span>
        </div>
      </div>
    </div>
  );
}

