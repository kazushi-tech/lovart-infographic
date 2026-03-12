import React from 'react';
import { Check } from 'lucide-react';

interface InterviewProgressProps {
  currentStep: number;
  totalSteps: number;
  onStepClick?: (step: number) => void;
}

export default function InterviewProgress({ currentStep, totalSteps, onStepClick }: InterviewProgressProps) {
  return (
    <div className="w-full bg-slate-900 border-b border-slate-800 shrink-0 px-4 py-3">
      <div className="flex items-center justify-between">
        {Array.from({ length: totalSteps }).map((_, i) => {
          const isCompleted = i < currentStep;
          const isCurrent = i === currentStep;
          const isClickable = isCompleted && onStepClick;

          return (
            <React.Fragment key={i}>
              <button
                onClick={() => isClickable && onStepClick(i)}
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
                  i < currentStep ? 'bg-blue-500/50' : 'bg-slate-800'
                }`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
      <div className="mt-2 text-center">
        <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
          {currentStep === totalSteps ? 'ヒアリング完了' : `ステップ ${currentStep + 1} / ${totalSteps}`}
        </span>
      </div>
    </div>
  );
}
