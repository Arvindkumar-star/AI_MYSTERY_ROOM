import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../api/client.js';
import { Loader2, CheckCircle2, AlertCircle, RefreshCw, Sparkles } from 'lucide-react';

const STAGES = [
  { key: 'moderate', label: 'Screening premise and safety verification' },
  { key: 'blueprint', label: 'Crafting incident, suspects, and hidden truth' },
  { key: 'evidence', label: 'Forging chat records, logs, and forensics' },
  { key: 'verify', label: 'Blind detective AI verifying fair solvability' },
  { key: 'done', label: 'Finalizing investigation dossier' },
];

export default function GeneratingPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: statusData, refetch } = useQuery({
    queryKey: ['caseStatus', id],
    queryFn: () => api.getCaseStatus(id),
    refetchInterval: (query) => (query.state.data?.status === 'generating' ? 2000 : false),
  });

  const retryMutation = useMutation({
    mutationFn: () => api.retryGeneration(id),
    onSuccess: () => refetch(),
  });

  const status = statusData?.status || 'generating';
  const stage = statusData?.generationStage || 'moderate';
  const progress = statusData?.progress || 10;
  const errorMsg = statusData?.error;

  useEffect(() => {
    if (status === 'ready') {
      const timer = setTimeout(() => {
        navigate(`/case/${id}`);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [status, id, navigate]);

  const currentStageIndex = STAGES.findIndex((s) => s.key === stage);

  return (
    <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-8">
      <div className="space-y-3">
        <div className="w-16 h-16 rounded-2xl bg-amber-dim/20 border border-amber/40 flex items-center justify-center text-amber mx-auto shadow-2xl">
          {status === 'failed' ? (
            <AlertCircle className="w-8 h-8 text-red-500" />
          ) : status === 'ready' ? (
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          ) : (
            <Loader2 className="w-8 h-8 animate-spin" />
          )}
        </div>
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-paper-50 tracking-tight">
          {status === 'failed'
            ? 'Case Generation Halted'
            : status === 'ready'
            ? 'Case Dossier Ready!'
            : 'Constructing Mystery Room...'}
        </h2>
        <p className="text-zinc-400 text-sm max-w-md mx-auto">
          {status === 'failed'
            ? 'The generative solver encountered an inconsistency or safety issue.'
            : 'Generating an internally coherent mystery with a verified deductive chain.'}
        </p>
      </div>

      {/* Progress Bar */}
      {status !== 'failed' && (
        <div className="w-full bg-noir-850 h-2 rounded-full overflow-hidden border border-noir-800">
          <div
            className="bg-amber h-full transition-all duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Stage Checklist */}
      <div className="bg-noir-900 border border-noir-800 rounded-xl p-6 text-left space-y-4 shadow-xl">
        {STAGES.map((s, idx) => {
          const isDone = currentStageIndex > idx || status === 'ready';
          const isCurrent = currentStageIndex === idx && status === 'generating';

          return (
            <div
              key={s.key}
              className={`flex items-center gap-3 text-xs sm:text-sm font-medium transition ${
                isDone
                  ? 'text-paper-100'
                  : isCurrent
                  ? 'text-amber font-semibold'
                  : 'text-zinc-600'
              }`}
            >
              <div className="w-5 h-5 flex items-center justify-center shrink-0">
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : isCurrent ? (
                  <Loader2 className="w-4 h-4 animate-spin text-amber" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-noir-700" />
                )}
              </div>
              <span className="flex-1">{s.label}</span>
            </div>
          );
        })}
      </div>

      {/* Error & Retry */}
      {status === 'failed' && (
        <div className="space-y-4">
          <p className="text-red-400 text-xs font-mono bg-red-950/50 p-3 rounded border border-red-900">
            {errorMsg || 'Failed to verify solvability after multiple attempts.'}
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 rounded text-xs text-zinc-400 hover:text-paper-100 transition"
            >
              Choose Different Premise
            </button>
            <button
              onClick={() => retryMutation.mutate()}
              disabled={retryMutation.isPending}
              className="px-5 py-2.5 rounded bg-amber hover:bg-amber-glow text-noir-950 text-xs font-serif font-bold transition flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${retryMutation.isPending ? 'animate-spin' : ''}`} />
              <span>Retry Generation</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

