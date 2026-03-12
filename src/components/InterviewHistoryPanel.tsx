/**
 * InterviewHistoryPanel Component
 *
 * 生成後の左カラムに表示する読み取り専用パネル
 * Q&A 履歴と簡易 brief summary を表示
 */

import React from 'react';
import { ClipboardList, MessageSquare } from 'lucide-react';
import type { FlowState } from '../brief/flowEngine';
import { getAnsweredQuestions, getAnswerSummaries } from '../brief/flowEngine';
import { compileBrief } from '../brief/compileBrief';

interface InterviewHistoryPanelProps {
  flowState: FlowState;
  className?: string;
  style?: React.CSSProperties;
}

export default function InterviewHistoryPanel({
  flowState,
  className = '',
  style,
}: InterviewHistoryPanelProps) {
  const answeredQuestions = getAnsweredQuestions(flowState);
  const brief = compileBrief(flowState.answers);

  return (
    <aside className={`flex flex-col shrink-0 relative z-20 ${className}`} style={style}>
      {/* Header */}
      <div className="h-12 border-b border-slate-800 flex items-center px-4 shrink-0 bg-slate-950">
        <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-blue-400" />
          ヒアリング結果
        </h2>
      </div>

      {/* Q&A History */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
        {answeredQuestions.map(({ question, value }) => (
          <div key={question.id} className="space-y-1">
            <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
              {question.prompt}
            </p>
            <p className="text-xs text-slate-200 bg-slate-800/50 rounded-lg px-3 py-2">
              {question.summarize(value)}
            </p>
          </div>
        ))}
      </div>

      {/* Brief Summary */}
      <div className="border-t border-slate-800 p-4 space-y-2 bg-slate-900/80 shrink-0">
        <h3 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <MessageSquare className="w-3 h-3" />
          ブリーフ要約
        </h3>
        <div className="space-y-1.5 text-[11px] text-slate-300">
          <div className="flex justify-between">
            <span className="text-slate-500">目的</span>
            <span className="text-right max-w-[60%] truncate">{brief.objective}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">出力形式</span>
            <span className="text-right max-w-[60%] truncate">{brief.outputTargetSummary}</span>
          </div>
          {brief.targetAudienceSummary && (
            <div className="flex justify-between">
              <span className="text-slate-500">対象</span>
              <span className="text-right max-w-[60%] truncate">{brief.targetAudienceSummary}</span>
            </div>
          )}
          {brief.visualPriorities && (
            <div className="flex justify-between">
              <span className="text-slate-500">スタイル</span>
              <span className="text-right max-w-[60%] truncate">{brief.visualPriorities}</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
