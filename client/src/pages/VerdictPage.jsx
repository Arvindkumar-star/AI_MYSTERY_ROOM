import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client.js';
import {
  Trophy,
  ShieldCheck,
  ShieldX,
  Clock,
  Sparkles,
  ArrowRight,
  RotateCcw,
  BookOpen,
  CheckCircle,
  AlertTriangle,
  Loader2,
} from 'lucide-react';

export default function VerdictPage() {
  const { id: investigationId } = useParams();
  const navigate = useNavigate();

  const { data: reveal, isLoading, error } = useQuery({
    queryKey: ['reveal', investigationId],
    queryFn: () => api.getReveal(investigationId),
  });

  const { data: investigation } = useQuery({
    queryKey: ['investigation', investigationId],
    queryFn: () => api.getInvestigation(investigationId),
  });

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-amber" />
        <p className="text-xs font-mono text-zinc-500 mt-3">Unsealing True Mystery Dossier...</p>
      </div>
    );
  }

  if (error || !reveal) {
    return (
      <div className="p-12 text-center text-zinc-500 space-y-4">
        <p>Solution could not be unsealed yet. (Investigation may still be active)</p>
        <button
          onClick={() => navigate(`/investigation/${investigationId}`)}
          className="px-4 py-2 rounded bg-amber text-noir-950 font-bold text-xs"
        >
          Return to Investigation
        </button>
      </div>
    );
  }

  const isSolved = investigation?.status === 'solved';

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 space-y-8">
      {/* Verdict Header Banner */}
      <div
        className={`p-6 sm:p-8 rounded-xl border shadow-2xl text-center space-y-4 relative overflow-hidden ${
          isSolved
            ? 'bg-emerald-950/40 border-emerald-800'
            : 'bg-red-950/40 border-red-800'
        }`}
      >
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto shadow-xl">
          {isSolved ? (
            <ShieldCheck className="w-16 h-16 text-emerald-400" />
          ) : (
            <ShieldX className="w-16 h-16 text-red-400" />
          )}
        </div>

        <div>
          <span className="text-xs font-mono uppercase tracking-widest font-bold text-zinc-400 block mb-1">
            OFFICIAL CORONER & POLICE VERDICT
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl font-extrabold text-paper-50 tracking-tight">
            {isSolved ? 'Case Solved: Justice Served' : 'Case Cold: Perpetrator Escaped'}
          </h1>
          <p className="text-zinc-300 text-sm max-w-lg mx-auto mt-2 leading-relaxed">
            {isSolved
              ? 'Your deduction successfully identified the true culprit through the physical evidence.'
              : 'All investigative attempts were exhausted. The true solution has now been unsealed.'}
          </p>
        </div>

        {/* Score & Rank Card */}
        <div className="inline-flex items-center gap-6 px-6 py-3 rounded-lg bg-noir-950/80 border border-noir-800 shadow-inner">
          <div className="text-left">
            <span className="text-[10px] font-mono text-zinc-500 uppercase block">Detective Rank</span>
            <span className="font-serif font-bold text-base text-amber">{reveal.rank}</span>
          </div>
          <div className="h-8 w-px bg-noir-800" />
          <div className="text-left">
            <span className="text-[10px] font-mono text-zinc-500 uppercase block">Final Score</span>
            <span className="font-mono font-bold text-xl text-paper-50">{reveal.score} pts</span>
          </div>
        </div>
      </div>

      {/* The True Culprit Revelation */}
      <div className="bg-noir-900 border border-noir-800 rounded-xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="border-b border-noir-800 pb-4">
          <span className="text-xs font-mono uppercase tracking-widest text-amber font-bold block mb-1">
            THE GUILTY PARTY
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-paper-50">
            {reveal.culpritName} <span className="text-sm font-mono text-zinc-500">({reveal.culpritId})</span>
          </h2>
        </div>

        {/* Motive & Method Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-noir-950 border border-noir-800 space-y-1">
            <h4 className="text-xs font-mono uppercase text-amber font-bold">Motive</h4>
            <p className="text-zinc-300 text-sm leading-relaxed font-sans">{reveal.motive}</p>
          </div>
          <div className="p-4 rounded-lg bg-noir-950 border border-noir-800 space-y-1">
            <h4 className="text-xs font-mono uppercase text-amber font-bold">Method & Opportunity</h4>
            <p className="text-zinc-300 text-sm leading-relaxed font-sans">
              {reveal.method} {reveal.opportunity}
            </p>
          </div>
        </div>

        {/* Full Explanation Narrative */}
        <div className="space-y-2 pt-2">
          <h4 className="text-xs font-mono uppercase text-zinc-400 font-bold">
            The Full Deductive Solution
          </h4>
          <div className="p-5 rounded-lg bg-noir-950/80 border border-noir-800 text-paper-100 font-serif text-sm sm:text-base leading-relaxed italic">
            "{reveal.fullExplanation}"
          </div>
        </div>

        {/* Chronological True Timeline */}
        {reveal.timeline && reveal.timeline.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-noir-800">
            <h4 className="text-xs font-mono uppercase text-zinc-400 font-bold flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber" />
              <span>True Chronological Timeline</span>
            </h4>
            <div className="border border-noir-800 rounded divide-y divide-noir-800 bg-noir-950 text-xs font-mono">
              {reveal.timeline.map((step, idx) => (
                <div key={idx} className="p-3 flex items-start gap-4">
                  <span className="text-amber font-bold w-20 shrink-0">{step.time}</span>
                  <span className="text-zinc-300 font-sans">{step.event}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Key Evidence vs Red Herrings Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-noir-800">
          {/* Key Clues */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase text-emerald-400 font-bold flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4" />
              <span>Decisive Key Evidence</span>
            </h4>
            <div className="space-y-2">
              {reveal.keyEvidence?.map((ke) => (
                <div key={ke.evidenceId} className="p-3 rounded bg-emerald-950/20 border border-emerald-900 text-xs">
                  <span className="font-bold text-paper-100 block">{ke.title}</span>
                  <span className="text-zinc-400 text-[11px] mt-0.5 block">{ke.why}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Red Herrings */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase text-zinc-400 font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber" />
              <span>Disproved Red Herrings</span>
            </h4>
            <div className="space-y-2">
              {reveal.redHerrings?.map((rh, idx) => (
                <div key={idx} className="p-3 rounded bg-noir-950 border border-noir-800 text-xs">
                  <span className="font-bold text-amber block">{rh.evidenceId}</span>
                  <span className="text-zinc-400 text-[11px] mt-0.5 block">{rh.explanation}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Replay Actions */}
      <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3.5 rounded-xl bg-amber hover:bg-amber-glow text-noir-950 font-serif font-bold text-sm shadow-xl transition flex items-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Solve Another Case</span>
        </button>
        <button
          onClick={() => navigate('/history')}
          className="px-6 py-3.5 rounded-xl bg-noir-900 hover:bg-noir-850 text-paper-100 border border-noir-800 font-serif font-semibold text-sm transition flex items-center gap-2"
        >
          <BookOpen className="w-4 h-4 text-amber" />
          <span>Case Archive</span>
        </button>
      </div>
    </div>
  );
}

