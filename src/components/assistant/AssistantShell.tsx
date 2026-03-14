import React, { useMemo } from 'react';
import { Bot } from 'lucide-react';
import { INTERVIEW_STEPS, AnswerEntry, StepOption, AdaptiveFieldId } from '../../interview/schema';
import type { InterviewFieldId } from '../../interview/schema';
import type { InterviewWizardState, FollowUpAnswerEntry } from '../../interview/state';
import { buildBriefDraft, buildBriefQuality } from '../../interview/state';
import WizardWelcomeView from './WizardWelcomeView';
import WizardStepTabs from './WizardStepTabs';
import WizardStepDialog from './WizardStepDialog';
import WizardFollowUpDialog from './WizardFollowUpDialog';
import WizardReviewView from './WizardReviewView';

interface AssistantShellProps {
  wizardState: InterviewWizardState;
  onAnswerCommit: (entry: AnswerEntry) => void;
  onFollowUpCommit: (answer: FollowUpAnswerEntry) => void;
  onFollowUpSkip: () => void;
  onBack: () => void;
  onGoToStep: (index: number) => void;
  onResolveIssue?: (fieldId: InterviewFieldId) => void;
  onStartInterview: () => void;
  onSample: () => void;
  onGenerate: () => void;
  onCancel: () => void;
  isGenerateDisabled: boolean;
  isGenerateLoading: boolean;
  // M3: Adaptive options support
  adaptiveOptions?: Record<AdaptiveFieldId, StepOption[]>;
  isAdaptiveLoading?: (fieldId: AdaptiveFieldId) => boolean;
}

export default function AssistantShell({
  wizardState,
  onAnswerCommit,
  onFollowUpCommit,
  onFollowUpSkip,
  onBack,
  onGoToStep,
  onResolveIssue,
  onStartInterview,
  onSample,
  onGenerate,
  onCancel,
  isGenerateDisabled,
  isGenerateLoading,

  adaptiveOptions = { targetAudience: [], keyMessage: [], tone: [], supplementary: [] },
  isAdaptiveLoading = () => false,
}: AssistantShellProps) {
  const { activeStepIndex, answers, phase, currentFollowUp } = wizardState;
  const briefDraft = buildBriefDraft(answers);
  const quality = useMemo(
    () => buildBriefQuality(answers, wizardState.followUpAnswers),
    [answers, wizardState.followUpAnswers]
  );

  const isWelcome = phase === 'idle';
  const isReview = phase === 'review';
  const isFollowUp = phase === 'follow-up' && currentFollowUp !== null;
  const currentStep = INTERVIEW_STEPS[activeStepIndex];

  // Navigate to the step that owns a given field
  const handleGoToField = (fieldId: InterviewFieldId) => {
    const idx = INTERVIEW_STEPS.findIndex(s => s.fieldId === fieldId);
    if (idx >= 0) onGoToStep(idx);
  };

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
          isFollowUp={isFollowUp}
        />
      )}

      {/* Content area */}
      {isWelcome ? (
        <WizardWelcomeView onStartInterview={onStartInterview} onSample={onSample} />
      ) : isReview ? (
        <WizardReviewView
          briefDraft={briefDraft}
          quality={quality}
          followUpAnswers={wizardState.followUpAnswers}
          onGenerate={onGenerate}
          onBack={onBack}
          onGoToField={handleGoToField}
          onResolveIssue={onResolveIssue}
          isGenerateDisabled={isGenerateDisabled}
          isGenerateLoading={isGenerateLoading}
        />
      ) : isFollowUp && currentFollowUp ? (
        <WizardFollowUpDialog
          packet={currentFollowUp}
          onCommit={onFollowUpCommit}
          onSkip={onFollowUpSkip}
          onBack={onBack}
        />
      ) : currentStep ? (
        <WizardStepDialog
          step={currentStep}
          adaptiveOptions={adaptiveOptions}
          isAdaptiveLoading={isAdaptiveLoading}
          existingAnswer={answers[currentStep.fieldId]}
          onCommit={onAnswerCommit}
          onBack={onBack}
          isFirst={activeStepIndex === 0}
        />
      ) : null}
    </div>
  );
}
