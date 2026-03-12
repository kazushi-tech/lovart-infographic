import React from 'react';
import { Download, FileText, Archive, LayoutTemplate } from 'lucide-react';

interface DownloadActionsProps {
  hasSlides: boolean;
}

export default function DownloadActions({ hasSlides }: DownloadActionsProps) {
  return (
    <div className="space-y-2">
      <button
        disabled={!hasSlides}
        className="w-full flex items-center justify-between p-2.5 rounded bg-slate-950 border border-slate-800 hover:border-blue-500 hover:bg-blue-500/10 disabled:opacity-50 disabled:hover:border-slate-800 disabled:hover:bg-slate-950 transition-all group"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded bg-red-500/20 flex items-center justify-center text-red-400 group-hover:bg-red-500/30 transition-colors">
            <FileText className="w-3.5 h-3.5" />
          </div>
          <div className="text-left">
            <p className="text-[11px] font-medium text-slate-200">PDF形式</p>
          </div>
        </div>
        <Download className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400" />
      </button>

      <button
        disabled={!hasSlides}
        className="w-full flex items-center justify-between p-2.5 rounded bg-slate-950 border border-slate-800 hover:border-blue-500 hover:bg-blue-500/10 disabled:opacity-50 disabled:hover:border-slate-800 disabled:hover:bg-slate-950 transition-all group"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded bg-amber-500/20 flex items-center justify-center text-amber-400 group-hover:bg-amber-500/30 transition-colors">
            <Archive className="w-3.5 h-3.5" />
          </div>
          <div className="text-left">
            <p className="text-[11px] font-medium text-slate-200">ZIP (画像)</p>
          </div>
        </div>
        <Download className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400" />
      </button>

      <button
        disabled={!hasSlides}
        className="w-full flex items-center justify-between p-2.5 rounded bg-slate-950 border border-slate-800 hover:border-blue-500 hover:bg-blue-500/10 disabled:opacity-50 disabled:hover:border-slate-800 disabled:hover:bg-slate-950 transition-all group"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded bg-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/30 transition-colors">
            <LayoutTemplate className="w-3.5 h-3.5" />
          </div>
          <div className="text-left">
            <p className="text-[11px] font-medium text-slate-200">HTML形式</p>
          </div>
        </div>
        <Download className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400" />
      </button>
    </div>
  );
}
