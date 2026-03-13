import React from 'react';
import { INTERVIEW_STEPS, AnswerEntry } from '../../interview/schema';
import { Check } from 'lucide-react';

/** Primary 4 steps shown as named tabs; remaining steps are collapsed. */
const PRIMARY_STEP_LABELS: Record<string, string> = {
  theme: 'テーマ',
  styleId: 'デザイン',
  slideCount: '枚数',
  targetAudience: 'ターゲット',
};

interface WizardStepTabsProps {
  activeStepIndex: number;
  answers: Partial<Record<string, AnswerEntry>>;
  onGoToStep: (index: number) => void;
  isReview?: boolean;
}

export default function WizardStepTabs({
  activeStepIndex,
  answers,
  onGoToStep,
  isReview = false,
}: WizardStepTabsProps) {
  return (
    <div className="px-4 py-3 bg-slate-900/80 border-b border-slate-800">
      <div className="flex items-center gap-1">
        {INTERVIEW_STEPS.map((step, i) => {
          const isCompleted = !!answers[step.fieldId];
          const isCurrent = !isReview && i === activeStepIndex;
          const isClickable = isCompleted && !isCurrent;
          const primaryLabel = PRIMARY_STEP_LABELS[step.fieldId];

          return (
            <React.Fragment key={step.fieldId}>
              <button
                onClick={() => isClickable && onGoToStep(i)}
                disabled={!isClickable}
                title={step.question}
                className={`shrink-0 h-7 rounded-full flex items-center gap-1.5 transition-all text-[11px] font-medium ${
                  primaryLabel ? 'px-3' : 'w-7 justify-center'
                } ${
                  isCompleted
                    ? 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 cursor-pointer'
                    : isCurrent
                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/40'
                    : 'bg-slate-800/60 text-slate-500'
                } ${!isClickable && !isCurrent ? 'cursor-default' : ''}`}
              >
                {isCompleted ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <span className="text-[10px]">{i + 1}</span>
                )}
                {primaryLabel && <span>{primaryLabel}</span>}
              </button>
              {i < INTERVIEW_STEPS.length - 1 && (
                <div className={`w-3 h-px ${isCompleted ? 'bg-blue-500/40' : 'bg-slate-800'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
      <div className="mt-1.5 text-center">
        <span className="text-[10px] font-medium text-slate-500 tracking-wider">
          {isReview
            ? 'ヒアリング完了'
            : `ステップ ${activeStepIndex + 1} / ${INTERVIEW_STEPS.length}`}
        </span>
      </div>
    </div>
  );
}
