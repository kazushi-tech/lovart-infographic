import React, { useState, useEffect } from 'react';
import { InterviewStep, StepOption, AnswerEntry } from '../interview/schema';

interface QuestionStepCardProps {
  step: InterviewStep;
  existingAnswer?: AnswerEntry;
  onCommit: (entry: AnswerEntry) => void;
  onBack?: () => void;
  isFirst: boolean;
}

export default function QuestionStepCard({
  step,
  existingAnswer,
  onCommit,
  onBack,
  isFirst,
}: QuestionStepCardProps) {
  const [pendingChoice, setPendingChoice] = useState<StepOption | null>(null);
  const [textValue, setTextValue] = useState('');

  // Restore existing answer when navigating back
  useEffect(() => {
    if (existingAnswer) {
      if (step.inputType === 'text') {
        setTextValue(existingAnswer.value);
      } else {
        const opt = step.options?.find(o => o.id === existingAnswer.value);
        setPendingChoice(opt ?? null);
      }
    } else {
      setPendingChoice(null);
      setTextValue('');
    }
  }, [step.fieldId, existingAnswer]);

  const handleCommit = () => {
    if (step.inputType === 'text') {
      if (!textValue.trim()) return;
      onCommit({
        fieldId: step.fieldId,
        value: textValue.trim(),
        label: textValue.trim(),
        source: 'text',
      });
    } else if (pendingChoice) {
      onCommit({
        fieldId: step.fieldId,
        value: pendingChoice.id,
        label: pendingChoice.label,
        source: 'choice',
      });
    }
  };

  const canCommit = step.inputType === 'text' ? textValue.trim().length > 0 : pendingChoice !== null;

  return (
    <div className="flex flex-col h-full">
      {/* Question */}
      <div className="px-6 pt-8 pb-4">
        <h2 className="text-lg font-semibold text-slate-100 leading-relaxed">
          {step.question}
        </h2>
      </div>

      {/* Answer area */}
      <div className="flex-1 overflow-y-auto px-6 pb-4 custom-scrollbar">
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
            {step.options?.map(opt => {
              const isSelected = pendingChoice?.id === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setPendingChoice(opt)}
                  className={`text-left rounded-xl border overflow-hidden transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-500/10 ring-1 ring-blue-500/30'
                      : 'border-slate-700 bg-slate-950 hover:border-slate-600 hover:bg-slate-900'
                  }`}
                >
                  {opt.imageUrl && (
                    <div className="h-24 overflow-hidden">
                      <img
                        src={opt.imageUrl}
                        alt={opt.label}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-3">
                    <p className={`text-xs font-medium ${isSelected ? 'text-blue-300' : 'text-slate-200'}`}>
                      {opt.label}
                    </p>
                    {opt.desc && (
                      <p className="text-[10px] text-slate-500 mt-1">{opt.desc}</p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="space-y-2 mt-2">
            {step.options?.map(opt => {
              const isSelected = pendingChoice?.id === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setPendingChoice(opt)}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-500/10 ring-1 ring-blue-500/30'
                      : 'border-slate-700 bg-slate-950 hover:border-slate-600 hover:bg-slate-900'
                  }`}
                >
                  <p className={`text-sm font-medium ${isSelected ? 'text-blue-300' : 'text-slate-200'}`}>
                    {opt.label}
                  </p>
                  {opt.desc && (
                    <p className="text-[10px] text-slate-500 mt-1">{opt.desc}</p>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer: Back + Next */}
      <div className="px-6 py-4 border-t border-slate-800 flex items-center gap-3">
        {!isFirst && (
          <button
            onClick={onBack}
            className="px-4 py-2.5 text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors"
          >
            戻る
          </button>
        )}
        <button
          onClick={handleCommit}
          disabled={!canCommit}
          className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
            canCommit
              ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
        >
          {step.required ? '次へ' : 'スキップまたは次へ'}
        </button>
      </div>
    </div>
  );
}
