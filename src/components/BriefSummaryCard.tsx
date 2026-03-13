import React from 'react';
import { BriefDraft } from '../interview/schema';
import { getBriefSummaryItems } from '../interview/brief';
import { Sparkles, FileText, Target, MessageSquare, Palette, Edit3, CheckCircle2, Loader2 } from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = {
  'テーマ': FileText,
  'スタイル': Palette,
  'スライド枚数': FileText,
  'ターゲット': Target,
  'キーメッセージ': MessageSquare,
  'トーン＆マナー': MessageSquare,
  '補足事項': FileText,
};

interface BriefSummaryCardProps {
  briefDraft: BriefDraft;
  onGenerate: () => void;
  isGenerated: boolean;
  isGenerateDisabled?: boolean;
  isGenerateLoading?: boolean;
}

export default function BriefSummaryCard({
  briefDraft,
  onGenerate,
  isGenerated,
  isGenerateDisabled = false,
  isGenerateLoading = false,
}: BriefSummaryCardProps) {
  const items = getBriefSummaryItems(briefDraft);

  return (
    <div className="p-4 bg-slate-900 border-t border-slate-800 shrink-0 shadow-lg z-10">
      <div className="bg-slate-950 border border-slate-700 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
          <h3 className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ヒアリング完了
          </h3>
          <button className="text-slate-500 hover:text-slate-300 transition-colors" title="編集">
            <Edit3 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3 max-h-48 overflow-y-auto custom-scrollbar">
          {items.map(item => (
            <div key={item.label} className="space-y-1">
              <div className="flex items-center gap-1.5 text-slate-400">
                {React.createElement(ICON_MAP[item.label] || FileText, { className: "w-3 h-3" })}
                <span className="text-[10px] font-medium uppercase tracking-wider">{item.label}</span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed pl-4.5">{item.value}</p>
            </div>
          ))}
        </div>

        {/* Action */}
        {!isGenerated && (
          <div className="p-4 border-t border-slate-800 bg-slate-900/50 space-y-3">
            <button
              onClick={onGenerate}
              disabled={isGenerateDisabled || isGenerateLoading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white shadow-blue-500/20"
            >
              {isGenerateLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {isGenerateLoading ? '確認中...' : 'スライドを生成する'}
            </button>
            {isGenerateDisabled && (
              <p className="text-[10px] text-slate-500 text-center">
                APIキー設定を確認中...
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

