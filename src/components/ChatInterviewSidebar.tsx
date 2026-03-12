/**
 * Chat Interview Sidebar Component
 *
 * 適応的インタビューフローを提供するサイドバー
 * flowEngine を使用して動的に質問を表示
 */

import React from 'react';
import { ChatMessage, InterviewData, StyleOption } from '../types/domain';
import InterviewProgress from './InterviewProgress';
import ChatComposer from './ChatComposer';
import BriefSummaryCard from './BriefSummaryCard';
import ChatMessageList from './ChatMessageList';
import { Bot, MessageSquare } from 'lucide-react';
import type { FlowState, BriefQuestion } from '../brief/flowEngine';

interface ChatInterviewSidebarProps {
  messages: ChatMessage[];
  interviewData: Partial<InterviewData>;
  isGenerated: boolean;
  onSendMessage: (text: string, optionId?: string) => void;
  onSelectStyle: (option: StyleOption) => void;
  onGenerate: () => void;
  onStepClick?: (step: number) => void;
  className?: string;
  style?: React.CSSProperties;
  isGenerateDisabled?: boolean;
  isGenerateLoading?: boolean;
  // New props for flow engine integration
  flowState: FlowState;
  nextQuestion: BriefQuestion | null;
  isComplete: boolean;
  progress: { current: number; total: number };
}

export default function ChatInterviewSidebar({
  messages,
  interviewData,
  isGenerated,
  onSendMessage,
  onSelectStyle,
  onGenerate,
  onStepClick,
  className = '',
  style,
  isGenerateDisabled = false,
  isGenerateLoading = false,
  flowState,
  nextQuestion,
  isComplete,
  progress,
}: ChatInterviewSidebarProps) {
  const lastMessage = messages[messages.length - 1];
  const isWaitingForChips = lastMessage?.inputMode === 'options';

  return (
    <aside className={`flex flex-col shrink-0 relative z-20 ${className}`} style={style}>
      {/* Header & Progress */}
      <div className="h-12 border-b border-slate-800 flex items-center px-4 shrink-0 bg-slate-950">
        <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <Bot className="w-4 h-4 text-blue-400" />
          AI アシスタント
        </h2>
      </div>
      <InterviewProgress
        currentStep={progress.current}
        totalSteps={progress.total}
        onStepClick={onStepClick}
      />

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto custom-scrollbar relative">
        {messages.length === 1 && messages[0].id === 'welcome-msg' && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full px-6 space-y-3">
            <button
              onClick={() => onSendMessage('テーマを入力する')}
              className="w-full text-left p-3 bg-slate-950 border border-slate-800 hover:border-blue-500/50 hover:bg-blue-500/5 rounded-xl flex items-center gap-3 transition-all group"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0 group-hover:bg-blue-500/20 transition-colors">
                <Bot className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-200">対話形式で始める</p>
                <p className="text-[10px] text-slate-500 mt-0.5">テーマを入力してインタビューを開始</p>
              </div>
            </button>
          </div>
        )}
        <ChatMessageList
          messages={messages}
          onSelectOption={onSelectStyle}
          isGenerated={isGenerated}
        />
      </div>

      {/* Footer Area (Composer or Summary) */}
      {isComplete && !isGenerated && (
        <BriefSummaryCard
          interviewData={interviewData}
          styles={messages.find((m) => m.optionsType === 'grid')?.options || []}
          onGenerate={onGenerate}
          isGenerated={isGenerated}
          isGenerateDisabled={isGenerateDisabled}
          isGenerateLoading={isGenerateLoading}
          compiledBrief={flowState.answers}
        />
      )}
      {(!isComplete || isGenerated) && (
        <div className="flex flex-col">
          {isGenerated && (
            <BriefSummaryCard
              interviewData={interviewData}
              styles={messages.find((m) => m.optionsType === 'grid')?.options || []}
              onGenerate={onGenerate}
              isGenerated={isGenerated}
              isGenerateDisabled={isGenerateDisabled}
              isGenerateLoading={isGenerateLoading}
              compiledBrief={flowState.answers}
            />
          )}
          <ChatComposer
            onSend={onSendMessage}
            disabled={isWaitingForChips}
            placeholder={isWaitingForChips ? '上の選択肢から選んでください' : '追加の指示を入力...'}
          />
        </div>
      )}
    </aside>
  );
}
