import React from 'react';
import type { BriefDraft, InterviewFieldId } from '../../interview/schema';
import { getBriefSummaryItems, getQualityIssueGroups, buildGenerationBrief } from '../../interview/brief';
import type { BriefQualityResult } from '../../interview/answerQuality';
import type { FollowUpAnswerEntry } from '../../interview/state';
import { Sparkles, Loader2, FileText, Palette, Target, MessageSquare, AlertTriangle, AlertCircle, Brain, Users, Crosshair, ListChecks, Info } from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = {
  'テーマ': FileText,
  'スタイル': Palette,
  'スライド枚数': FileText,
  'ターゲット': Target,
  'キーメッセージ': MessageSquare,
  'トーン＆マナー': MessageSquare,
  '補足事項': FileText,
};

const BRIEF_ICON_MAP: Record<string, React.ElementType> = {
  'audience': Users,
  'goal': Crosshair,
  'must-include': ListChecks,
  'assumption': Info,
};

interface WizardReviewViewProps {
  briefDraft: BriefDraft;
  quality?: BriefQualityResult;
  followUpAnswers?: FollowUpAnswerEntry[];
  onGenerate: () => void;
  onBack: () => void;
  onGoToField?: (fieldId: InterviewFieldId) => void;
  onResolveIssue?: (fieldId: InterviewFieldId) => void;
  isGenerateDisabled: boolean;
  isGenerateLoading: boolean;
}

export default function WizardReviewView({
  briefDraft,
  quality,
  followUpAnswers = [],
  onGenerate,
  onBack,
  onGoToField,
  onResolveIssue,
  isGenerateDisabled,
  isGenerateLoading,
}: WizardReviewViewProps) {
  const items = getBriefSummaryItems(briefDraft);
  const issueGroups = quality ? getQualityIssueGroups(quality) : [];
  const hasCritical = quality?.hasCritical ?? false;
  const generateBlocked = hasCritical || isGenerateDisabled;

  // Build "AI understanding" sections
  const followUpHints = followUpAnswers
    .map(a => a.promptHint)
    .filter((h): h is string => !!h);
  const briefSections = buildGenerationBrief(briefDraft, followUpHints, followUpAnswers);

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
        {/* Assistant message */}
        <div className="mb-5 p-4 bg-slate-800/40 rounded-xl border border-slate-700/50">
          <p className="text-sm text-slate-300 leading-relaxed">
            {hasCritical
              ? '入力内容に重大な不足があります。該当項目をクリックし、選択肢で補足してから生成してください。'
              : quality?.hasWarning
              ? 'ヒアリングが完了しました。一部改善の余地があります。必要なら項目をクリックして選択肢で補足できます。'
              : 'ヒアリングが完了しました。以下がAIの理解です。認識にズレがあれば項目をクリックして修正してください。'}
          </p>
        </div>

        {/* Quality warnings */}
        {issueGroups.length > 0 && (
          <div className="mb-4 space-y-2">
            {issueGroups.map(group => (
              <div key={group.fieldId}>
                {group.flags.map((flag, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      if (onResolveIssue) {
                        onResolveIssue(flag.fieldId);
                        return;
                      }
                      onGoToField?.(flag.fieldId);
                    }}
                    className={`w-full text-left p-3 rounded-lg border flex items-start gap-3 transition-colors ${
                      flag.severity === 'critical'
                        ? 'bg-red-950/40 border-red-800/50 hover:bg-red-950/60'
                        : 'bg-amber-950/30 border-amber-800/40 hover:bg-amber-950/50'
                    }`}
                  >
                    {flag.severity === 'critical' ? (
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0">
                      <p className={`text-xs font-medium ${flag.severity === 'critical' ? 'text-red-300' : 'text-amber-300'}`}>
                        {group.label}: {flag.message}
                      </p>
                      {flag.suggestion && (
                        <p className="text-xs text-slate-400 mt-1">{flag.suggestion}</p>
                      )}
                      <p className="text-[11px] text-slate-500 mt-2">クリックすると候補を開いて補足できます</p>
                    </div>
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* AI Understanding sections */}
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="w-4 h-4 text-blue-400" />
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">AI の理解</h3>
          </div>
          <div className="space-y-2">
            {briefSections.map((section, i) => {
              const SectionIcon = BRIEF_ICON_MAP[section.type] || Info;
              return (
                <div key={i} className="bg-blue-950/20 border border-blue-800/20 rounded-lg px-4 py-3 flex items-start gap-3">
                  <SectionIcon className="w-4 h-4 text-blue-400/70 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-medium text-blue-300/60 uppercase tracking-wider mb-0.5">{section.label}</p>
                    <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-line">{section.content}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Original summary card */}
        <div className="mb-3">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">入力内容</h3>
        </div>
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
          disabled={generateBlocked || isGenerateLoading}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white shadow-blue-500/20"
        >
          {isGenerateLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          {isGenerateLoading
            ? '生成中...'
            : hasCritical
            ? '選択肢で補足してください'
            : 'この理解で生成する'}
        </button>
      </div>
    </div>
  );
}
