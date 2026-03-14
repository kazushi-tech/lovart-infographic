import React, { useState, useRef, useCallback } from 'react';
import { ChevronLeft, HelpCircle } from 'lucide-react';
import type { AdaptiveQuestionPacket, StepOption } from '../../interview/schema';
import type { FollowUpAnswerEntry } from '../../interview/state';
import ChoiceOptionCard from './ChoiceOptionCard';

interface WizardFollowUpDialogProps {
  packet: AdaptiveQuestionPacket;
  onCommit: (answer: FollowUpAnswerEntry) => void;
  onSkip: () => void;
  onBack: () => void;
}

export default function WizardFollowUpDialog({
  packet,
  onCommit,
  onSkip,
  onBack,
}: WizardFollowUpDialogProps) {
  const [pendingChoice, setPendingChoice] = useState<StepOption | null>(null);
  const [customText, setCustomText] = useState('');
  const commitLockRef = useRef(false);

  const doCommit = useCallback((answer: FollowUpAnswerEntry) => {
    if (commitLockRef.current) return;
    commitLockRef.current = true;
    onCommit(answer);
  }, [onCommit]);

  const handleChoiceSelect = useCallback((opt: StepOption) => {
    setPendingChoice(opt);
    if (commitLockRef.current) return;
    commitLockRef.current = true;
    onCommit({
      followUpId: packet.id,
      parentFieldId: packet.parentFieldId,
      value: opt.id,
      label: opt.label,
      source: 'follow-up',
      promptHint: opt.promptHint,
    });
  }, [packet.id, packet.parentFieldId, onCommit]);

  const handleCustomCommit = useCallback(() => {
    if (!customText.trim()) return;
    doCommit({
      followUpId: packet.id,
      parentFieldId: packet.parentFieldId,
      value: customText.trim(),
      label: customText.trim(),
      source: 'text',
    });
  }, [packet.id, packet.parentFieldId, customText, doCommit]);

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="px-6 pt-5 pb-3 shrink-0">
        <div className="flex items-start gap-2">
          <button
            onClick={onBack}
            className="mt-0.5 p-1 rounded-md text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-colors shrink-0"
            aria-label="戻る"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-lg font-semibold text-slate-100 leading-relaxed">
              {packet.question}
            </h2>
            {/* Reason badge */}
            <div className="mt-2 flex items-start gap-2 p-2.5 bg-blue-950/30 border border-blue-800/30 rounded-lg">
              <HelpCircle className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-300/80 leading-relaxed">{packet.reason}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Options */}
      <div className="flex-1 overflow-y-auto px-6 pb-4 custom-scrollbar min-h-0">
        <div className="space-y-2 mt-2">
          {packet.options.map(opt => (
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
        </div>

        {/* Free text fallback */}
        <div className="mt-4">
          <p className="text-xs text-slate-500 mb-2">{packet.fallbackPrompt}</p>
          <input
            type="text"
            value={customText}
            onChange={e => setCustomText(e.target.value)}
            placeholder="自由に入力..."
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-colors"
            onKeyDown={e => {
              if (e.key === 'Enter' && customText.trim()) {
                e.preventDefault();
                handleCustomCommit();
              }
            }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-slate-800 flex items-center gap-3 shrink-0">
        <button
          onClick={onSkip}
          className="px-4 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-slate-200 bg-slate-800/50 hover:bg-slate-800 transition-all"
        >
          スキップ
        </button>
        {customText.trim() && (
          <button
            onClick={handleCustomCommit}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20 transition-all"
          >
            送信
          </button>
        )}
      </div>
    </div>
  );
}
