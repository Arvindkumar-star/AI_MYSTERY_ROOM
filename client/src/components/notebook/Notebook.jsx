import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, Check, Loader2 } from 'lucide-react';

export default function Notebook({ initialNotes = '', onSave }) {
  const [notes, setNotes] = useState(initialNotes);
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved'
  const isFirstRender = useRef(true);

  useEffect(() => {
    setNotes(initialNotes);
  }, [initialNotes]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    setSaveStatus('saving');
    const timer = setTimeout(async () => {
      try {
        if (onSave) {
          await onSave(notes);
        }
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch {
        setSaveStatus('idle');
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [notes, onSave]);

  return (
    <div className="flex flex-col h-full bg-noir-900 border border-noir-800 rounded-lg overflow-hidden shadow-lg">
      <div className="px-4 py-3 bg-noir-850 border-b border-noir-800 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-2 text-paper-100 font-bold uppercase tracking-wider">
          <BookOpen className="w-4 h-4 text-amber" />
          <span>Detective's Notebook</span>
        </div>
        <div className="flex items-center gap-1.5 text-zinc-400">
          {saveStatus === 'saving' && (
            <span className="flex items-center gap-1 text-amber text-[11px]">
              <Loader2 className="w-3 h-3 animate-spin" /> Saving...
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="flex items-center gap-1 text-emerald-400 text-[11px]">
              <Check className="w-3 h-3" /> Saved
            </span>
          )}
          {saveStatus === 'idle' && (
            <span className="text-[11px] text-zinc-500">Auto-saved</span>
          )}
        </div>
      </div>

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Type theories, alibi inconsistencies, or key timeline discrepancies here..."
        className="flex-1 w-full p-4 bg-transparent text-paper-100 placeholder:text-zinc-600 font-mono text-xs sm:text-sm leading-relaxed resize-none focus:outline-none"
      />
    </div>
  );
}

