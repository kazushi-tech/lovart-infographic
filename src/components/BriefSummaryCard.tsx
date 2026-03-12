/**
 * Brief Summary Card Component
 *
 * インタビュー完了時にブリーフ内容を要約表示するカード
 * CompiledBrief を受け取り、必要な情報を表示
 */

import React, { useState } from 'react';
import { InterviewData, StyleOption } from '../types/domain';
import { Sparkles, FileText, Target, MessageSquare, Palette, Edit3, CheckCircle2, Loader2, Code } from 'lucide-react';
import { compileBrief } from '../brief/compileBrief';

interface BriefSummaryCardProps {
  interviewData: Partial<InterviewData>;
  styles: StyleOption[];
  onGenerate: () => void;
  isGenerated: boolean;
  isGenerateDisabled?: boolean;
  isGenerateLoading?: boolean;
  compiledBrief?: Record<string, unknown>;
}

export default function BriefSummaryCard({
  interviewData,
  styles,
  onGenerate,
  isGenerated,
  isGenerateDisabled = false,
  isGenerateLoading = false,
  compiledBrief,
}: BriefSummaryCardProps) {
  const [showPromptPanel, setShowPromptPanel] = useState(false);

  // Compile brief if not provided
  const brief = compiledBrief ? compileBrief(compiledBrief) : null;

  return (
    <div className="p-4 bg-slate-900 border-t border-slate-800 shrink-0 shadow-lg z-10">
      <div className="bg-slate-950 border border-slate-700 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
          <h3 className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ヒアリング完了
          </h3>
          <div className="flex items-center gap-1">
            {brief && (
              <button
                onClick={() => setShowPromptPanel(!showPromptPanel)}
                className="p-1.5 hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-colors rounded-lg"
                title="プロンプトを確認"
              >
                <Code className="w-3.5 h-3.5" />
              </button>
            )}
            {!isGenerated && (
              <button className="text-slate-500 hover:text-slate-300 transition-colors" title="編集">
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3 max-h-48 overflow-y-auto custom-scrollbar">
          {brief ? (
            <>
              <SummaryItem icon={FileText} label="タイトル" value={brief.title} />
              <SummaryItem icon={Target} label="目的" value={brief.objective} />
              <SummaryItem icon={MessageSquare} label="ソース" value={brief.sourceMaterialSummary} />
              {brief.targetAudienceSummary && (
                <SummaryItem icon={Target} label="ターゲット" value={brief.targetAudienceSummary} />
              )}
              {brief.intentSummary && (
                <SummaryItem icon={MessageSquare} label="インテント" value={brief.intentSummary} />
              )}
              <SummaryItem icon={FileText} label="出力形式" value={brief.outputTargetSummary} />
              {brief.visualPriorities && (
                <SummaryItem icon={Palette} label="スタイル" value={brief.visualPriorities} />
              )}
              {brief.requiredInclusions.length > 0 && (
                <SummaryItem
                  icon={FileText}
                  label="必須項目"
                  value={brief.requiredInclusions.join(', ')}
                />
              )}
              {interviewData.styleId && (
                <SummaryItem
                  icon={Palette}
                  label="スタイル"
                  value={styles.find((s) => s.id === interviewData.styleId)?.label || interviewData.styleId}
                />
              )}
              {interviewData.slideCount && (
                <SummaryItem icon={FileText} label="スライド枚数" value={`${interviewData.slideCount}枚`} />
              )}
              {interviewData.targetAudience && (
                <SummaryItem icon={Target} label="ターゲット" value={interviewData.targetAudience} />
              )}
              {interviewData.keyMessage && (
                <SummaryItem icon={MessageSquare} label="キーメッセージ" value={interviewData.keyMessage} />
              )}
              {interviewData.tone && (
                <SummaryItem icon={MessageSquare} label="トーン" value={interviewData.tone} />
              )}
              {interviewData.supplementary && (
                <SummaryItem icon={FileText} label="補足" value={interviewData.supplementary} />
              )}
            </>
          ) : (
            <>
              <SummaryItem icon={FileText} label="テーマ" value={interviewData.theme} />
              <SummaryItem
                icon={Palette}
                label="スタイル"
                value={styles.find((s) => s.id === interviewData.styleId)?.label || interviewData.styleId}
              />
              <SummaryItem icon={FileText} label="スライド枚数" value={interviewData.slideCount ? `${interviewData.slideCount}枚` : undefined} />
              <SummaryItem icon={Target} label="ターゲット" value={interviewData.targetAudience} />
              <SummaryItem icon={MessageSquare} label="キーメッセージ" value={interviewData.keyMessage} />
              <SummaryItem icon={MessageSquare} label="トーン＆マナー" value={interviewData.tone} />
              <SummaryItem icon={FileText} label="補足事項" value={interviewData.supplementary} />
            </>
          )}
        </div>

        {/* Prompt Panel */}
        {showPromptPanel && brief && (
          <div className="px-4 pb-4">
            <div className="bg-slate-900 border border-slate-700 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Code className="w-3 h-3" />
                  生成プロンプト
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(brief.promptText);
                  }}
                  className="text-[10px] text-blue-400 hover:text-blue-300 transition-colors"
                >
                  コピー
                </button>
              </div>
              <pre className="text-[10px] text-slate-300 whitespace-pre-wrap font-mono max-h-32 overflow-y-auto custom-scrollbar">
                {brief.promptText}
              </pre>
            </div>
          </div>
        )}

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

function SummaryItem({ icon: Icon, label, value }: { icon: any; label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-slate-400">
        <Icon className="w-3 h-3" />
        <span className="text-[10px] font-medium uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-xs text-slate-200 leading-relaxed pl-4.5">{value}</p>
    </div>
  );
}
