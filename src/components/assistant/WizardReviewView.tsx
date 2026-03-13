import React from 'react';
import type { BriefDraft } from '../../interview/schema';
import { getBriefSummaryItems } from '../../interview/brief';
import { Sparkles, Loader2, FileText, Palette, Target, MessageSquare } from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = {
  'テーマ': FileText,
  'スタイル': Palette,
  'スライド枚数': FileText,
  'ターゲット': Target,
  'キーメッセージ': MessageSquare,
  'トーン＆マナー': MessageSquare,
  '補足事項': FileText,
};

interface WizardReviewViewProps {
  briefDraft: BriefDraft;
  onGenerate: () => void;
  onBack: () => void;
  isGenerateDisabled: boolean;
  isGenerateLoading: boolean;
}

export default function WizardReviewView({
  briefDraft,
  onGenerate,
  onBack,
  isGenerateDisabled,
  isGenerateLoading,
}: WizardReviewViewProps) {
  const items = getBriefSummaryItems(briefDraft);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
        {/* Assistant message */}
        <div className="mb-5 p-4 bg-slate-800/40 rounded-xl border border-slate-700/50">
          <p className="text-sm text-slate-300 leading-relaxed">
            ヒアリングが完了しました。以下の内容でスライドを生成します。修正が必要な場合は「戻る」で各ステップに戻れます。
          </p>
        </div>

        {/* Summary card */}
        <div className="space-y-2.5">
          {items.map(item => {
            const Icon = ICON_MAP[item.label] || FileText;
            return (
              <div key={item.label} className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-slate-800/80 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-0.5">{item.label}</p>
                  <p className="text-sm text-slate-200 leading-relaxed">{item.value}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-slate-800 flex items-center gap-3">
        <button
          onClick={onBack}
          className="px-4 py-2.5 text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors"
        >
          戻る
        </button>
        <button
          onClick={onGenerate}
          disabled={isGenerateDisabled || isGenerateLoading}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white shadow-blue-500/20"
        >
          {isGenerateLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          {isGenerateLoading ? '生成中...' : 'スライドを生成する'}
        </button>
      </div>
    </div>
  );
}
