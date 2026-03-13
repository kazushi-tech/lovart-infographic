import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft } from 'lucide-react';
import type { InterviewStep, StepOption, AnswerEntry } from '../../interview/schema';
import ChoiceOptionCard from './ChoiceOptionCard';

interface WizardStepDialogProps {
  step: InterviewStep;
  existingAnswer?: AnswerEntry;
  onCommit: (entry: AnswerEntry) => void;
  onBack?: () => void;
  isFirst: boolean;
}

export default function WizardStepDialog({
  step,
  existingAnswer,
  onCommit,
  onBack,
  isFirst,
}: WizardStepDialogProps) {
  const [pendingChoice, setPendingChoice] = useState<StepOption | null>(null);
  const [textValue, setTextValue] = useState('');
  const [customText, setCustomText] = useState('');

  // Double-commit guard: prevent rapid clicks from advancing 2 steps
  const commitLockRef = useRef(false);

  const isCustomMode = pendingChoice?.mode === 'custom';
  const isChoiceStep = step.inputType === 'single-choice' || step.inputType === 'grid-choice';

  // Determine if footer should show primary action button
  // - text steps: always show
  // - custom input active: show send button
  // - preset choice (required): hidden (auto-advance handles it)
  // - preset choice (optional, no selection): show skip button instead
  const showPrimaryButton = !isChoiceStep || isCustomMode;
  const showSkipButton = isChoiceStep && !isCustomMode && !step.required;

  // Restore existing answer when navigating back
  useEffect(() => {
    commitLockRef.current = false;
    if (existingAnswer) {
      if (step.inputType === 'text') {
        setTextValue(existingAnswer.value);
      } else {
        const opt = step.options?.find(o => o.id === existingAnswer.value);
        if (opt) {
          setPendingChoice(opt);
        } else if (existingAnswer.source === 'text') {
          const otherOpt = step.options?.find(o => o.mode === 'custom');
          if (otherOpt) {
            setPendingChoice(otherOpt);
            setCustomText(existingAnswer.label);
          }
        }
      }
    } else {
      setPendingChoice(null);
      setTextValue('');
      setCustomText('');
    }
  }, [step.fieldId, existingAnswer]);

  const doCommit = useCallback((entry: AnswerEntry) => {
    if (commitLockRef.current) return;
    commitLockRef.current = true;
    onCommit(entry);
  }, [onCommit]);

  const handleCommit = useCallback(() => {
    if (step.inputType === 'text') {
      if (!textValue.trim()) return;
      doCommit({
        fieldId: step.fieldId,
        value: textValue.trim(),
        label: textValue.trim(),
        source: 'text',
      });
    } else if (pendingChoice) {
      if (isCustomMode) {
        if (!customText.trim()) return;
        doCommit({
          fieldId: step.fieldId,
          value: customText.trim(),
          label: customText.trim(),
          source: 'text',
        });
      } else {
        doCommit({
          fieldId: step.fieldId,
          value: pendingChoice.id,
          label: pendingChoice.label,
          source: 'choice',
        });
      }
    }
  }, [step.fieldId, step.inputType, textValue, pendingChoice, isCustomMode, customText, doCommit]);

  // Handle preset choice selection: auto-commit immediately
  const handleChoiceSelect = useCallback((opt: StepOption) => {
    setPendingChoice(opt);
    if (opt.mode !== 'custom') {
      setCustomText('');
      // Auto-commit preset choices immediately
      if (commitLockRef.current) return;
      commitLockRef.current = true;
      onCommit({
        fieldId: step.fieldId,
        value: opt.id,
        label: opt.label,
        source: 'choice',
      });
    }
  }, [step.fieldId, onCommit]);

  // Handle skip for optional steps
  const handleSkip = useCallback(() => {
    doCommit({
      fieldId: step.fieldId,
      value: '',
      label: '（スキップ）',
      source: 'text',
    });
  }, [step.fieldId, doCommit]);

  const canCommit = step.inputType === 'text'
    ? textValue.trim().length > 0
    : pendingChoice !== null && (!isCustomMode || customText.trim().length > 0);

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Question header with back button */}
      <div className="px-6 pt-5 pb-3 shrink-0">
        <div className="flex items-start gap-2">
          {!isFirst && (
            <button
              onClick={onBack}
              className="mt-0.5 p-1 rounded-md text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-colors shrink-0"
              aria-label="戻る"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <h2 className="text-lg font-semibold text-slate-100 leading-relaxed">
            {step.question}
          </h2>
        </div>
      </div>

      {/* Answer area */}
      <div className="flex-1 overflow-y-auto px-6 pb-4 custom-scrollbar min-h-0">
        {step.inputType === 'text' ? (
          <div className="mt-2">
            <textarea
              value={textValue}
              onChange={e => setTextValue(e.target.value)}
              placeholder={step.placeholder}
              className="w-full h-32 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 resize-none transition-colors"
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey && canCommit) {
                  e.preventDefault();
                  handleCommit();
                }
              }}
            />
          </div>
        ) : step.inputType === 'grid-choice' ? (
          <div className="grid grid-cols-2 gap-3 mt-2">
            {step.options?.map(opt => (
              <React.Fragment key={opt.id}>
                <ChoiceOptionCard
                  option={opt}
                  isSelected={pendingChoice?.id === opt.id}
                  onSelect={handleChoiceSelect}
                  disabled={commitLockRef.current}
                  variant="grid"
                />
              </React.Fragment>
            ))}
          </div>
        ) : (
          <div className="space-y-2 mt-2">
            {step.options?.map(opt => (
              <React.Fragment key={opt.id}>
                <ChoiceOptionCard
                  option={opt}
                  isSelected={pendingChoice?.id === opt.id}
                  onSelect={handleChoiceSelect}
                  disabled={commitLockRef.current}
                  variant="list"
                />
              </React.Fragment>
            ))}
            {/* Custom text input when "その他" is selected */}
            {isCustomMode && (
              <div className="mt-3 pl-7">
                <input
                  type="text"
                  value={customText}
                  onChange={e => setCustomText(e.target.value)}
                  placeholder="内容を入力してください..."
                  autoFocus
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-colors"
                  onKeyDown={e => {
                    if (e.key === 'Enter' && canCommit) {
                      e.preventDefault();
                      handleCommit();
                    }
                  }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer: conditionally shown */}
      {(showPrimaryButton || showSkipButton) && (
        <div className="px-6 py-4 border-t border-slate-800 flex items-center gap-3 shrink-0">
          {showPrimaryButton && (
            <button
              onClick={handleCommit}
              disabled={!canCommit}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                canCommit
                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              次へ
            </button>
          )}
          {showSkipButton && (
            <button
              onClick={handleSkip}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-slate-200 bg-slate-800/50 hover:bg-slate-800 transition-all"
            >
              スキップ
            </button>
          )}
        </div>
      )}
    </div>
  );
}
