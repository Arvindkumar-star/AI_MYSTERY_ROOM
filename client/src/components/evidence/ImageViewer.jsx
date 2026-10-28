import React from 'react';
import { Image as ImageIcon, AlertCircle, Eye } from 'lucide-react';

export default function ImageViewer({ payload, assetId, assetStatus = 'none', description }) {
  const { caption = '', altText = 'Evidence photograph', annotations = [] } = payload || {};

  const imageUrl = assetId && assetStatus === 'ready' ? `/api/assets/${assetId}` : null;

  return (
    <div className="h-full overflow-y-auto p-4 flex flex-col items-center justify-center">
      <div className="w-full max-w-xl bg-noir-900 border border-noir-800 rounded-lg overflow-hidden shadow-2xl p-4 flex flex-col items-center">
        {/* Visual Frame */}
        <div className="relative w-full aspect-video bg-noir-950 rounded border border-noir-800 flex items-center justify-center overflow-hidden">
          {imageUrl ? (
            <>
              <img
                src={imageUrl}
                alt={altText}
                className="w-full h-full object-cover"
              />
              {annotations.map((ann, idx) => (
                <div
                  key={idx}
                  style={{ left: `${ann.x * 100}%`, top: `${ann.y * 100}%` }}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
                >
                  <span className="w-4 h-4 rounded-full bg-amber text-noir-950 font-bold text-[10px] flex items-center justify-center ring-2 ring-noir-950 cursor-pointer shadow-lg animate-pulse">
                    {idx + 1}
                  </span>
                  <div className="absolute left-6 top-0 hidden group-hover:block bg-noir-950 text-paper-100 text-xs px-2.5 py-1 rounded border border-amber/40 shadow-xl whitespace-nowrap z-30">
                    {ann.label}
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className="text-center p-6 space-y-2 select-none">
              <ImageIcon className="w-10 h-10 text-noir-700 mx-auto" />
              <p className="text-xs font-mono text-zinc-400 uppercase tracking-widest">
                {assetStatus === 'pending'
                  ? 'Rendering Crime Scene Still...'
                  : 'Photographic Evidence (Text File)'}
              </p>
              <p className="text-xs text-zinc-500 max-w-sm italic">
                "{description || caption || altText}"
              </p>
            </div>
          )}
        </div>

        {/* Caption & Metadata */}
        <div className="w-full mt-4 border-t border-noir-800 pt-3 flex flex-col gap-1">
          <p className="text-xs text-zinc-400 font-mono flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-amber" />
            <span>EXHIBIT CAPTION:</span>
          </p>
          <p className="text-sm text-paper-100 font-serif leading-relaxed">
            {caption || description || altText}
          </p>
        </div>
      </div>
    </div>
  );
}

