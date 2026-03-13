import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Plus, Settings, History, X } from 'lucide-react';
import type { DeckSummary } from '../history/schema';

interface AppHeaderProps {
  onNew?: () => void;
  onOpenSettings?: () => void;
  isGenerated?: boolean;
  deckHistory?: DeckSummary[];
  onLoadDeck?: (id: string) => void;
  onDeleteDeck?: (id: string) => void;
}

export default function AppHeader({
  onNew,
  onOpenSettings,
  isGenerated,
  deckHistory = [],
  onLoadDeck,
  onDeleteDeck,
}: AppHeaderProps) {
  const [historyOpen, setHistoryOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!historyOpen) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setHistoryOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [historyOpen]);

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
        {/* History button */}
        {deckHistory.length > 0 && (
          <div className="relative" ref={panelRef}>
            <button
              onClick={() => setHistoryOpen(prev => !prev)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-slate-100 text-xs font-medium rounded-lg transition-colors border border-slate-700"
              aria-label="履歴"
            >
              <History className="w-4 h-4" />
              履歴 ({deckHistory.length})
            </button>

            {historyOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl shadow-black/40 z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">最近の履歴</span>
                  <button onClick={() => setHistoryOpen(false)} className="text-slate-500 hover:text-slate-300">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {deckHistory.map(deck => (
                    <div
                      key={deck.id}
                      className="px-4 py-3 hover:bg-slate-800/60 border-b border-slate-800/50 cursor-pointer group flex items-start justify-between gap-2"
                      onClick={() => { onLoadDeck?.(deck.id); setHistoryOpen(false); }}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] text-slate-200 font-medium truncate">{deck.theme || '無題'}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-slate-500">{deck.slideCount}枚</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                            deck.status === 'generated' ? 'bg-emerald-500/15 text-emerald-400' :
                            deck.status === 'failed' ? 'bg-red-500/15 text-red-400' :
                            'bg-slate-500/15 text-slate-400'
                          }`}>
                            {deck.status === 'generated' ? '完了' : deck.status === 'failed' ? '失敗' : '下書き'}
                          </span>
                          {deck.hasWarnings && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400">警告あり</span>
                          )}
                          <span className="text-[10px] text-slate-600">
                            {new Date(deck.updatedAt).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                      {onDeleteDeck && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onDeleteDeck(deck.id); }}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-600 hover:text-red-400 transition-all"
                          aria-label="削除"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {isGenerated && onNew && (
          <button
            onClick={onNew}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors border border-slate-700"
          >
            <Plus className="w-4 h-4" />
            新規作成
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
