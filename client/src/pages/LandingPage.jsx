import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client.js';
import { Search, Sparkles, Shield, Compass, BookOpen, AlertCircle, Loader2 } from 'lucide-react';

const EXAMPLE_PREMISES = [
  {
    title: 'The Silent Horologist',
    premise: 'A reclusive watchmaker is found dead in his locked workshop with a shattered pocket watch frozen at midnight and brass gear filings in his wound.',
    difficulty: 'medium',
    tone: 'noir',
  },
  {
    title: 'Curtain Call in Venice',
    premise: 'During the high-society opening night of Pagliacci at La Fenice opera house, the celebrated tenor collapses on stage from rare venom laced into his stage goblet.',
    difficulty: 'medium',
    tone: 'classic',
  },
  {
    title: 'The Greenhouse Heist',
    premise: 'A prized ghost orchid worth half a million pounds vanishes from a billionaire botanist’s climate-controlled conservatory during a stormy power outage.',
    difficulty: 'easy',
    tone: 'cozy',
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [premise, setPremise] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [tone, setTone] = useState('noir');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { data: recentCases } = useQuery({
    queryKey: ['recentCases'],
    queryFn: api.getCases,
    retry: false,
  });

  const handleOpenCase = async (e) => {
    e.preventDefault();
    if (premise.trim().length < 20) {
      setErrorMsg('Premise must be at least 20 characters long.');
      return;
    }
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const result = await api.createCase({
        title: title.trim() || undefined,
        premise: premise.trim(),
        difficulty,
        tone,
      });
      navigate(`/case/${result.caseId}/generating`);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to initialize case. Please check that the server is running.');
      setIsSubmitting(false);
    }
  };

  const loadPreset = (preset) => {
    setTitle(preset.title);
    setPremise(preset.premise);
    setDifficulty(preset.difficulty);
    setTone(preset.tone);
    setErrorMsg('');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 space-y-12">
      {/* Hero Section */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-noir-850 border border-noir-700 text-amber text-xs font-mono tracking-wider uppercase mb-2">
          <Sparkles className="w-3.5 h-3.5" /> Deductive AI Mystery Engine
        </div>
        <h1 className="font-serif text-3xl sm:text-5xl font-extrabold text-paper-50 tracking-tight leading-tight">
          Every Clue Counts. <br className="hidden sm:inline" />
          Every Case Solvable.
        </h1>
        <p className="text-zinc-400 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
          Type any scenario or premise. The system crafts suspects, forges WhatsApp chats, CCTV logs, forensics, and verifies fair deductive solvability before you step in.
        </p>
      </div>

      {/* Case Creation Card */}
      <div className="bg-noir-900 border border-noir-800 rounded-xl p-6 sm:p-8 shadow-2xl relative">
        <form onSubmit={handleOpenCase} className="space-y-6">
          {/* Case Title Input (Optional) */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-mono uppercase tracking-wider text-paper-100 font-bold">
                Case Title <span className="text-zinc-500 font-normal lowercase">(optional — AI generates one if blank)</span>
              </label>
              <span className="text-[11px] font-mono text-zinc-500">{title.length} / 100</span>
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 100))}
              placeholder="e.g., The Clockwork Parlor Murder, Death on the Venetian Gondola..."
              className="w-full bg-noir-950 border border-noir-800 rounded-lg px-4 py-2.5 text-sm text-paper-100 placeholder:text-zinc-600 font-serif focus:border-amber focus:outline-none transition"
            />
          </div>

          {/* Premise Textarea */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-mono uppercase tracking-wider text-paper-100 font-bold">
                Case Premise or Scenario
              </label>
              <span className="text-[11px] font-mono text-zinc-500">
                {premise.length} / 1000 (min 20)
              </span>
            </div>
            <textarea
              value={premise}
              onChange={(e) => setPremise(e.target.value.slice(0, 1000))}
              placeholder="Describe the incident, victim, setting, or mysterious circumstance..."
              rows={4}
              className="w-full bg-noir-950 border border-noir-800 rounded-lg p-4 text-sm text-paper-100 placeholder:text-zinc-600 font-sans focus:border-amber focus:outline-none transition leading-relaxed"
            />
          </div>

          {/* Presets */}
          <div>
            <span className="text-xs font-mono uppercase text-zinc-500 tracking-wider block mb-2 font-semibold">
              Or pick an unsolved dossier:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {EXAMPLE_PREMISES.map((ex, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => loadPreset(ex)}
                  className="text-left p-2.5 rounded bg-noir-950/70 border border-noir-800 hover:border-amber/60 hover:bg-noir-850 transition text-xs"
                >
                  <p className="font-serif font-bold text-paper-100">{ex.title}</p>
                  <p className="text-zinc-400 text-[11px] line-clamp-2 mt-1">{ex.premise}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty & Tone Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="text-xs font-mono uppercase tracking-wider text-paper-100 font-bold block mb-2">
                Difficulty
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'easy', label: 'Easy', desc: '4 suspects, 3 tries' },
                  { id: 'medium', label: 'Medium', desc: '5 suspects, 2 tries' },
                  { id: 'hard', label: 'Hard', desc: '6 suspects, 1 try' },
                ].map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setDifficulty(d.id)}
                    className={`py-2 px-2 rounded text-center border transition ${
                      difficulty === d.id
                        ? 'bg-amber-dim/20 border-amber text-amber font-bold'
                        : 'bg-noir-950 border-noir-800 text-zinc-400 hover:text-paper-100'
                    }`}
                  >
                    <div className="text-xs">{d.label}</div>
                    <div className="text-[10px] text-zinc-500 mt-0.5">{d.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-mono uppercase tracking-wider text-paper-100 font-bold block mb-2">
                Atmosphere & Tone
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {['classic', 'noir', 'cozy', 'thriller', 'scifi'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTone(t)}
                    className={`py-2 px-1 rounded text-center border capitalize text-xs transition ${
                      tone === t
                        ? 'bg-amber-dim/20 border-amber text-amber font-bold'
                        : 'bg-noir-950 border-noir-800 text-zinc-400 hover:text-paper-100'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3.5 rounded bg-red-950/70 border border-red-800 text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || premise.trim().length < 20}
            className="w-full py-3.5 px-6 rounded-lg bg-amber hover:bg-amber-glow disabled:opacity-40 disabled:cursor-not-allowed text-noir-950 font-serif font-bold text-base tracking-wide shadow-xl transition flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Opening Case File...</span>
              </>
            ) : (
              <span>Open Case File</span>
            )}
          </button>
        </form>
      </div>

      {/* Recent Cases */}
      {recentCases && recentCases.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-noir-800">
          <h3 className="font-serif text-lg font-bold text-paper-100 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-amber" />
            <span>Your Previous Cases</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {recentCases.slice(0, 4).map((c) => (
              <div
                key={c.id}
                onClick={() => navigate(c.status === 'ready' ? `/case/${c.id}` : `/case/${c.id}/generating`)}
                className="p-3.5 rounded bg-noir-900 border border-noir-800 hover:border-noir-700 hover:bg-noir-850 cursor-pointer transition flex items-center justify-between"
              >
                <div>
                  <h4 className="font-serif font-bold text-xs text-paper-100 truncate">{c.title}</h4>
                  <p className="text-[11px] text-zinc-400 capitalize">
                    {c.difficulty} • {c.tone} • {new Date(c.createdAt).toLocaleDateString()}
                  </p>
                </div>
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
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
