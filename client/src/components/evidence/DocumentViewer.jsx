import React from 'react';
import { FileText, Stamp } from 'lucide-react';

export default function DocumentViewer({ payload }) {
  if (!payload) return null;

  const { docType = 'document', header = {}, bodyMarkdown = '', footer = '' } = payload;
  const isReceiptOrLog = docType === 'receipt' || docType === 'invoice';

  return (
    <div className="h-full overflow-y-auto p-4 flex justify-center items-start">
      <div className="relative w-full max-w-2xl bg-paper-100 text-paper-900 shadow-2xl rounded p-8 sm:p-12 border border-paper-300">
        {/* Confidential / Evidence Stamp */}
        <div className="absolute top-6 right-6 pointer-events-none select-none opacity-80 rotate-12">
          <div className="border-4 border-red-800/70 text-red-800/80 px-3 py-1 font-mono font-black text-xs uppercase tracking-widest rounded">
            CASE FILE • EVIDENCE
          </div>
        </div>

        {/* Document Header */}
        <div className="border-b-2 border-paper-300 pb-4 mb-6">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-paper-800/70 mb-2">
            <FileText className="w-4 h-4 text-amber-dim" />
            <span>EXHIBIT DOCUMENT: {docType.toUpperCase()}</span>
          </div>
          {header && Object.keys(header).length > 0 && (
            <div className="grid grid-cols-2 gap-2 text-xs font-mono text-zinc-700 bg-paper-200/50 p-3 rounded">
              {Object.entries(header).map(([key, val]) => (
                <div key={key}>
                  <span className="font-semibold capitalize">{key}: </span>
                  <span>{String(val)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Document Body */}
        <div
          className={`leading-relaxed whitespace-pre-wrap text-sm ${
            isReceiptOrLog ? 'font-mono text-xs' : 'font-serif text-base'
          }`}
        >
          {bodyMarkdown}
        </div>

        {/* Document Footer */}
        {footer && (
          <div className="mt-8 pt-4 border-t border-paper-300 text-xs font-mono text-zinc-600 flex justify-between items-center">
            <span>{footer}</span>
            <span className="italic">Verified Authentic</span>
          </div>
        )}
      </div>
    </div>
  );
}

