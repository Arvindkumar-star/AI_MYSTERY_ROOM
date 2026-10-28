import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client.js';
import { BookOpen, History, ArrowRight, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';

export default function HistoryPage() {
  const navigate = useNavigate();

  const { data: cases, isLoading } = useQuery({
    queryKey: ['caseHistory'],
    queryFn: api.getCases,
  });

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-amber" />
        <p className="text-xs font-mono text-zinc-500 mt-3">Accessing Archive Vault...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 space-y-8">
      <div className="flex items-center justify-between border-b border-noir-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-amber mb-1">
            <History className="w-4 h-4" />
            <span>INVESTIGATOR DOSSIER ARCHIVE</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-4xl font-extrabold text-paper-50 tracking-tight">
            Case Archive & History
          </h1>
        </div>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 rounded-lg bg-amber hover:bg-amber-glow text-noir-950 font-serif font-bold text-xs shadow transition"
        >
          Open New Case
        </button>
      </div>

      {/* Case List */}
      {!cases || cases.length === 0 ? (
        <div className="p-12 text-center text-zinc-500 bg-noir-900 border border-noir-800 rounded-xl space-y-3">
          <BookOpen className="w-10 h-10 text-noir-700 mx-auto" />
          <p className="text-base font-serif text-paper-100 font-bold">No Closed or Open Cases Found</p>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            You have not yet opened any mystery files. Generate your first case from any premise.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {cases.map((c) => (
            <div
              key={c.id}
              onClick={() => navigate(c.status === 'ready' ? `/case/${c.id}` : `/case/${c.id}/generating`)}
              className="p-5 rounded-xl bg-noir-900 border border-noir-800 hover:border-amber/50 hover:bg-noir-850 cursor-pointer transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg group"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-serif font-bold text-base text-paper-100 group-hover:text-amber transition">
                    {c.title}
                  </h3>
                  <span
                    className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${
                      c.status === 'ready'
                        ? 'border-emerald-800 text-emerald-400 bg-emerald-950/40'
                        : 'border-amber/40 text-amber bg-amber-dim/20'
                    }`}
                  >
                    {c.status}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 font-mono capitalize">
                  {c.difficulty} Difficulty • {c.tone} Atmosphere • Opened on{' '}
                  {new Date(c.createdAt).toLocaleDateString()}
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono text-amber font-semibold group-hover:translate-x-1 transition">
                <span>View File</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

