import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../api/client.js';
import SuspectCard from '../components/suspects/SuspectCard.jsx';
import { Shield, MapPin, Calendar, Users, ArrowRight, Loader2, FileText } from 'lucide-react';

export default function BriefingPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: caseDoc, isLoading } = useQuery({
    queryKey: ['case', id],
    queryFn: () => api.getCase(id),
  });

  const startMutation = useMutation({
    mutationFn: () => api.startInvestigation(id),
    onSuccess: (data) => {
      navigate(`/investigation/${data._id}`);
    },
  });

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-amber" />
        <p className="text-xs font-mono text-zinc-500 mt-3">Unsealing Case Briefing...</p>
      </div>
    );
  }

  if (!caseDoc) {
    return (
      <div className="p-12 text-center text-zinc-500">
        <p>Case file could not be loaded.</p>
      </div>
    );
  }

  const { title, difficulty, tone, setting = {}, incident = {}, suspects = [] } = caseDoc;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 space-y-8">
      {/* Briefing Top Card */}
      <div className="bg-noir-900 border border-noir-800 rounded-xl p-6 sm:p-8 shadow-2xl relative">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-amber">
            <Shield className="w-4 h-4" />
            <span>CONFIDENTIAL BRIEFING DOSSIER</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-mono uppercase border border-noir-700 bg-noir-850 text-zinc-400">
              {difficulty}
            </span>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono uppercase border border-noir-700 bg-noir-850 text-zinc-400">
              {tone}
            </span>
          </div>
        </div>

        <h1 className="font-serif text-2xl sm:text-4xl font-extrabold text-paper-50 tracking-tight leading-tight mb-4">
          {title}
        </h1>

        {/* Setting Atmosphere */}
        <p className="text-zinc-300 font-serif italic text-sm sm:text-base leading-relaxed bg-noir-950/70 p-4 rounded border-l-2 border-amber mb-6">
          "{setting.atmosphere || 'A quiet, uneasy silence hung heavy in the air.'}"
        </p>

        {/* Setting & Incident Meta */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono border-t border-b border-noir-800 py-4 mb-6">
          <div className="flex items-center gap-2 text-zinc-400">
            <MapPin className="w-4 h-4 text-amber shrink-0" />
            <span>{incident.location || setting.place || 'Unknown Location'}</span>
          </div>
          <div className="flex items-center gap-2 text-zinc-400">
            <Calendar className="w-4 h-4 text-amber shrink-0" />
            <span>{incident.occurredAt ? new Date(incident.occurredAt).toLocaleString() : setting.era || 'Recent'}</span>
          </div>
        </div>

        {/* Incident Summary */}
        <div className="space-y-2">
          <h3 className="font-serif font-bold text-sm text-paper-100 flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber" />
            <span>The Incident</span>
          </h3>
          <p className="text-zinc-300 text-sm leading-relaxed font-sans">
            {incident.summary}
          </p>
        </div>
      </div>

      {/* Suspect Lineup Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl font-bold text-paper-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-amber" />
            <span>Persons of Interest ({suspects.length})</span>
          </h2>
          <span className="text-xs text-zinc-500 font-mono">One is guilty.</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {suspects.map((suspect) => (
            <SuspectCard key={suspect.suspectId} suspect={suspect} />
          ))}
        </div>
      </div>

      {/* Begin Investigation CTA */}
      <div className="pt-4 text-center">
        <button
          onClick={() => startMutation.mutate()}
          disabled={startMutation.isPending}
          className="w-full sm:w-auto px-8 py-4 rounded-xl bg-amber hover:bg-amber-glow disabled:opacity-50 text-noir-950 font-serif font-extrabold text-base tracking-wide shadow-2xl transition flex items-center justify-center gap-3 mx-auto"
        >
          {startMutation.isPending ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Entering Investigation Room...</span>
            </>
          ) : (
            <>
              <span>Begin Investigation</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

