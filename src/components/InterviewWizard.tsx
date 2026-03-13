import React from 'react';
import { INTERVIEW_STEPS, AnswerEntry } from '../interview/schema';
import { InterviewWizardState, buildBriefDraft } from '../interview/state';
import QuestionStepCard from './QuestionStepCard';
import BriefSummaryCard from './BriefSummaryCard';
import { Bot, Check, Sparkles, Loader2 } from 'lucide-react';
import type { BriefDraft } from '../interview/schema';

interface InterviewWizardProps {
  state: InterviewWizardState;
  onAnswerCommit: (entry: AnswerEntry) => void;
  onBack: () => void;
  onGoToStep: (index: number) => void;
  onCancel: () => void;
  onSample: () => void;
  onGenerate: () => void;
  isGenerateDisabled: boolean;
  isGenerateLoading: boolean;
}

export default function InterviewWizard({
  state,
  onAnswerCommit,
  onBack,
  onGoToStep,
  onCancel,
  onSample,
  onGenerate,
  isGenerateDisabled,
  isGenerateLoading,
}: InterviewWizardProps) {
  const { activeStepIndex, answers, phase } = state;
  const totalSteps = INTERVIEW_STEPS.length;
  const briefDraft = buildBriefDraft(answers);

  // Show welcome screen if no answers yet and on first step
  const isWelcome = phase === 'collecting' && activeStepIndex === 0 && Object.keys(answers).length === 0;

  if (isWelcome) {
    return (
      <div className="flex flex-col h-full">
        <WizardHeader activeStepIndex={-1} totalSteps={totalSteps} answers={answers} onGoToStep={onGoToStep} />
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center mb-6">
            <Bot className="w-8 h-8 text-blue-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-100 mb-2">インフォグラフィックを作成</h2>
          <p className="text-sm text-slate-400 mb-8 text-center max-w-sm">
            いくつかの質問に答えるだけで、プロフェッショナルなスライドを自動生成します。
          </p>
          <div className="w-full max-w-sm space-y-3">
            <button
              onClick={onSample}
              className="w-full text-left p-4 bg-slate-950 border border-slate-800 hover:border-blue-500/50 hover:bg-blue-500/5 rounded-xl flex items-center gap-3 transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0 group-hover:bg-blue-500/20 transition-colors">
                <Sparkles className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-200">サンプルで試す</p>
                <p className="text-[11px] text-slate-500 mt-0.5">AI導入に関するデモデータで開始</p>
              </div>
            </button>
            <button
              onClick={() => {/* User will type in the theme step which auto-shows next */}}
              className="w-full text-left p-4 bg-slate-950 border border-slate-800 hover:border-slate-600 hover:bg-slate-800/50 rounded-xl flex items-center gap-3 transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center shrink-0 group-hover:bg-slate-700 transition-colors">
                <Bot className="w-5 h-5 text-slate-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-200">テーマを入力して開始</p>
                <p className="text-[11px] text-slate-500 mt-0.5">対話形式で要件を定義します</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'review') {
    return (
      <div className="flex flex-col h-full">
        <WizardHeader activeStepIndex={totalSteps} totalSteps={totalSteps} answers={answers} onGoToStep={onGoToStep} />
        <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
          <h2 className="text-lg font-semibold text-slate-100 mb-4">要件の確認</h2>
          <ReviewSummary briefDraft={briefDraft} />
        </div>
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

  // Collecting phase: show current question
  const currentStep = INTERVIEW_STEPS[activeStepIndex];
  if (!currentStep) return null;

  return (
    <div className="flex flex-col h-full">
      <WizardHeader activeStepIndex={activeStepIndex} totalSteps={totalSteps} answers={answers} onGoToStep={onGoToStep} />
      <QuestionStepCard
        step={currentStep}
        existingAnswer={answers[currentStep.fieldId]}
        onCommit={onAnswerCommit}
        onBack={onBack}
        isFirst={activeStepIndex === 0}
      />
    </div>
  );
}

// --- Sub-components ---

function WizardHeader({
  activeStepIndex,
  totalSteps,
  answers,
  onGoToStep,
}: {
  activeStepIndex: number;
  totalSteps: number;
  answers: Partial<Record<string, AnswerEntry>>;
  onGoToStep: (index: number) => void;
}) {
  return (
    <div className="shrink-0 border-b border-slate-800">
      <div className="h-12 flex items-center px-4 bg-slate-950">
        <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <Bot className="w-4 h-4 text-blue-400" />
          AI アシスタント
        </h2>
      </div>
      <div className="px-4 py-3 bg-slate-900">
        <div className="flex items-center justify-between">
          {INTERVIEW_STEPS.map((step, i) => {
            const isCompleted = !!answers[step.fieldId];
            const isCurrent = i === activeStepIndex;
            const isClickable = isCompleted && i !== activeStepIndex;

            return (
              <React.Fragment key={step.fieldId}>
                <button
                  onClick={() => isClickable && onGoToStep(i)}
                  disabled={!isClickable}
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                    isCompleted
                      ? 'bg-blue-500 text-white cursor-pointer hover:bg-blue-400'
                      : isCurrent
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {isCompleted ? <Check className="w-3.5 h-3.5" /> : i + 1}
                </button>
                {i < totalSteps - 1 && (
                  <div className={`flex-1 h-0.5 mx-1 rounded-full ${
                    isCompleted ? 'bg-blue-500/50' : 'bg-slate-800'
                  }`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
        <div className="mt-2 text-center">
          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
            {activeStepIndex >= totalSteps
              ? 'ヒアリング完了'
              : activeStepIndex < 0
              ? '開始'
              : `ステップ ${activeStepIndex + 1} / ${totalSteps}`}
          </span>
        </div>
      </div>
    </div>
  );
}

function ReviewSummary({ briefDraft }: { briefDraft: BriefDraft }) {
  const items = [
    { label: 'テーマ', value: briefDraft.theme },
    { label: 'スタイル', value: briefDraft.styleLabel },
    { label: 'スライド枚数', value: briefDraft.slideCount ? `${briefDraft.slideCount}枚` : undefined },
    { label: 'ターゲット', value: briefDraft.targetAudience },
    { label: 'キーメッセージ', value: briefDraft.keyMessage },
    { label: 'トーン＆マナー', value: briefDraft.tone },
    { label: '補足事項', value: briefDraft.supplementary },
  ];

  return (
    <div className="space-y-3">
      {items.map(item => {
        if (!item.value) return null;
        return (
          <div key={item.label} className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3">
            <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1">{item.label}</p>
            <p className="text-sm text-slate-200">{item.value}</p>
          </div>
        );
      })}
    </div>
  );
}
