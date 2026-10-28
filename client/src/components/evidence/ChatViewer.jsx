import React from 'react';
import { MessageSquare, CheckCheck, Trash2 } from 'lucide-react';

export default function ChatViewer({ payload }) {
  if (!payload || !payload.messages) {
    return <div className="p-8 text-zinc-500 italic">No chat messages found.</div>;
  }

  const { app = 'Chat', isGroup, participants = [], messages = [] } = payload;

  return (
    <div className="flex flex-col h-full bg-[#0b141a] text-zinc-200 rounded-lg overflow-hidden border border-noir-800 shadow-xl">
      {/* Chat Header */}
      <div className="bg-[#202c33] px-4 py-3 flex items-center justify-between border-b border-[#2a3942]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-dim/50 border border-amber/40 flex items-center justify-center text-amber font-serif font-bold text-sm">
            {isGroup ? 'GRP' : (participants[0]?.name?.[0] || 'C')}
          </div>
          <div>
            <h3 className="font-semibold text-sm text-zinc-100">
              {isGroup
                ? 'Group Chat'
                : participants.map((p) => p.name).filter(Boolean).join(', ') || 'Direct Conversation'}
            </h3>
            <p className="text-[11px] text-zinc-400 capitalize">
              {app.replace(/_/g, ' ')} • {messages.length} messages
            </p>
          </div>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[radial-gradient(#1f2c34_1px,transparent_1px)] [background-size:16px_16px]">
        {messages.map((msg, idx) => {
          const isDeleted = msg.deleted;
          const isMe = idx % 2 === 1; // Visual alternation for clarity

          return (
            <div
              key={idx}
              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-full`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[70%] rounded-lg px-3 py-2 text-sm shadow-sm relative ${
                  isDeleted
                    ? 'bg-[#182229] text-zinc-500 italic border border-zinc-800'
                    : isMe
                    ? 'bg-[#005c4b] text-zinc-100 rounded-tr-none'
                    : 'bg-[#202c33] text-zinc-100 rounded-tl-none'
                }`}
              >
                {!isMe && !isDeleted && (
                  <p className="text-[11px] font-bold text-amber-glow/90 mb-0.5">
                    {msg.sender}
                  </p>
                )}

                {isDeleted ? (
                  <div className="flex items-center gap-1.5 py-0.5 text-xs">
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>This message was deleted</span>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap break-words leading-relaxed text-[13px]">
                    {msg.text}
                  </p>
                )}

                <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-zinc-400 select-none">
                  <span>
                    {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                  {isMe && !isDeleted && (
                    <CheckCheck className="w-3.5 h-3.5 text-cyan-400" />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

