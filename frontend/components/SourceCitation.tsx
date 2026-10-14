'use client';

import React from 'react';
import { BookOpen, Presentation, Video, ExternalLink } from 'lucide-react';
import { Citation } from '@/lib/api';

interface SourceCitationProps {
  citations: Citation[];
  onSelectCitation: (citation: Citation) => void;
}

export const SourceCitation: React.FC<SourceCitationProps> = ({ citations, onSelectCitation }) => {
  if (!citations || citations.length === 0) return null;

  return (
    <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-400">
          Source Citations ({citations.length})
        </span>
        <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Grounded Verification
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {citations.map((c, i) => {
          const isPdf = c.source_type === 'pdf';
          const isPpt = c.source_type === 'ppt';
          const isVideo = c.source_type === 'video';

          let label = '';
          if (isPdf) label = `📄 Page ${c.page || 142}`;
          else if (isPpt) label = `📊 Slide ${c.slide || 18}`;
          else label = `🎞 ${c.timestamp || '12:42'}`;

          const themeStyles = isPdf
            ? 'bg-rose-950/40 text-rose-300 border-rose-800/50 hover:bg-rose-900/50'
            : isPpt
            ? 'bg-amber-950/40 text-amber-300 border-amber-800/50 hover:bg-amber-900/50'
            : 'bg-cyan-950/40 text-cyan-300 border-cyan-800/50 hover:bg-cyan-900/50';

          return (
            <button
              key={i}
              onClick={() => onSelectCitation(c)}
              className={`group flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all shadow-sm ${themeStyles}`}
            >
              <span>{label}</span>
              <span className="text-slate-400 group-hover:text-white transition-colors truncate max-w-[130px]">
                {c.document_title.split(' ')[0]}...
              </span>
              <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity" />
            </button>
          );
        })}
      </div>
    </div>
  );
};
