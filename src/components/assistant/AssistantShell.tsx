import React from 'react';
import { Bot } from 'lucide-react';
import { INTERVIEW_STEPS, AnswerEntry } from '../../interview/schema';
import type { BriefDraft } from '../../interview/schema';
import type { InterviewWizardState } from '../../interview/state';
import { buildBriefDraft } from '../../interview/state';
import WizardWelcomeView from './WizardWelcomeView';
import WizardStepTabs from './WizardStepTabs';
import WizardStepDialog from './WizardStepDialog';
import WizardReviewView from './WizardReviewView';

interface AssistantShellProps {
  wizardState: InterviewWizardState;
  onAnswerCommit: (entry: AnswerEntry) => void;
  onBack: () => void;
  onGoToStep: (index: number) => void;
  onStartInterview: () => void;
  onSample: () => void;
  onGenerate: () => void;
  onCancel: () => void;
  isGenerateDisabled: boolean;
  isGenerateLoading: boolean;
}

export default function AssistantShell({
  wizardState,
  onAnswerCommit,
  onBack,
  onGoToStep,
  onStartInterview,
  onSample,
  onGenerate,
  onCancel,
  isGenerateDisabled,
  isGenerateLoading,
}: AssistantShellProps) {
  const { activeStepIndex, answers, phase } = wizardState;
  const briefDraft = buildBriefDraft(answers);

  const isWelcome = phase === 'idle';
  const isReview = phase === 'review';
  const currentStep = INTERVIEW_STEPS[activeStepIndex];

  return (
    <div className="w-full max-w-4xl h-full max-h-full flex flex-col bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden min-h-0">
      {/* Shell header */}
      <div className="shrink-0 h-12 flex items-center px-4 bg-slate-950 border-b border-slate-800">
        <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <Bot className="w-4 h-4 text-blue-400" />
          AI アシスタント
        </h2>
      </div>

      {/* Step tabs (hidden on welcome) */}
      {!isWelcome && (
        <WizardStepTabs
          activeStepIndex={activeStepIndex}
          answers={answers}
          onGoToStep={onGoToStep}
          isReview={isReview}
        />
      )}

      {/* Content area */}
      {isWelcome ? (
        <WizardWelcomeView onStartInterview={onStartInterview} onSample={onSample} />
      ) : isReview ? (
        <WizardReviewView
          briefDraft={briefDraft}
          onGenerate={onGenerate}
          onBack={onBack}
          isGenerateDisabled={isGenerateDisabled}
          isGenerateLoading={isGenerateLoading}
        />
      ) : currentStep ? (
        <WizardStepDialog
          step={currentStep}
          existingAnswer={answers[currentStep.fieldId]}
          onCommit={onAnswerCommit}
          onBack={onBack}
          isFirst={activeStepIndex === 0}
        />
      ) : null}
    </div>
  );
}
