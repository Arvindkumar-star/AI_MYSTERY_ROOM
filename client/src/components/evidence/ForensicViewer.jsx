import React from 'react';
import { Microscope, Activity, CheckCircle } from 'lucide-react';

export default function ForensicViewer({ payload }) {
  if (!payload) return null;

  const { reportType = 'Forensic Analysis', findings = [], conclusion = '' } = payload;

  return (
    <div className="h-full overflow-y-auto p-4 flex justify-center items-start">
      <div className="w-full max-w-2xl bg-noir-900 border border-noir-800 shadow-2xl rounded-lg p-6 sm:p-8 font-sans">
        {/* Lab Header */}
        <div className="flex items-center justify-between border-b border-noir-800 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-cyan-950/80 border border-cyan-800/60 flex items-center justify-center text-cyan-400">
              <Microscope className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-paper-100 capitalize">
                {reportType} Analysis
              </h3>
              <p className="text-xs text-zinc-400 font-mono">
                LAB REF: #FOR-{Math.abs(reportType.length * 379)}
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded bg-cyan-950/50 border border-cyan-800 text-cyan-300 text-[11px] font-mono uppercase tracking-wider">
            Verified Forensic
          </span>
        </div>

        {/* Findings Table */}
        <div className="space-y-4">
          <h4 className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-bold">
            Laboratory Observations & Readings
          </h4>
          <div className="border border-noir-800 rounded divide-y divide-noir-800 overflow-hidden bg-noir-950/50">
            {findings.map((item, idx) => (
              <div key={idx} className="p-3.5 flex flex-col sm:flex-row sm:justify-between gap-1 text-sm">
                <span className="font-semibold text-zinc-300">{item.label}</span>
                <span className="text-paper-100 font-mono text-xs sm:text-sm">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Official Conclusion */}
        {conclusion && (
          <div className="mt-6 p-4 rounded bg-emerald-950/20 border border-emerald-900/60">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-400 uppercase tracking-wide mb-1">
              <CheckCircle className="w-4 h-4" />
              <span>Official Pathologist / Lab Conclusion</span>
            </div>
            <p className="text-paper-100 text-sm leading-relaxed">{conclusion}</p>
          </div>
        )}
      </div>
    </div>
  );
}

