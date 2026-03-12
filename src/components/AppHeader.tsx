import React from 'react';
import { Sparkles, Plus, Settings, Clock } from 'lucide-react';

interface AppHeaderProps {
  onNew?: () => void;
  onOpenHistory?: () => void;
  onOpenSettings?: () => void;
  isGenerated?: boolean;
}

export default function AppHeader({ onNew, onOpenHistory, onOpenSettings, isGenerated }: AppHeaderProps) {
  return (
    <header className="h-14 bg-slate-950 border-b border-slate-800 flex items-center justify-between px-6 shrink-0 z-40">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-slate-100 tracking-tight">Lovart Infographic</h1>
          <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">Workspace v2.0</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {onNew && (
          <button
            onClick={onNew}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors border border-slate-700"
          >
            <Plus className="w-4 h-4" />
            新規作成
          </button>
        )}
        {onOpenHistory && (
          <button
            onClick={onOpenHistory}
            className="p-2 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors rounded-lg"
            aria-label="プロジェクト履歴"
            title="プロジェクト履歴"
          >
            <Clock className="w-5 h-5" />
          </button>
        )}
        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            className="p-2 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors rounded-lg"
            aria-label="設定"
          >
            <Settings className="w-5 h-5" />
          </button>
        )}
      </div>
    </header>
  );
}
