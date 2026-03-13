import React from 'react';
import { ChatMessage } from '../demoData';
import { BriefDraft } from '../interview/schema';
import ChatComposer from './ChatComposer';
import BriefSummaryCard from './BriefSummaryCard';
import ChatMessageList from './ChatMessageList';
import { Bot } from 'lucide-react';

interface ChatInterviewSidebarProps {
  messages: ChatMessage[];
  briefDraft: BriefDraft;
  isGenerated: boolean;
  onSendMessage: (text: string) => void;
  onGenerate: () => void;
  className?: string;
  style?: React.CSSProperties;
  isGenerateDisabled?: boolean;
  isGenerateLoading?: boolean;
}

export default function ChatInterviewSidebar({
  messages,
  briefDraft,
  isGenerated,
  onSendMessage,
  onGenerate,
  className = "",
  style,
  isGenerateDisabled = false,
  isGenerateLoading = false,
}: ChatInterviewSidebarProps) {
  return (
    <aside className={`flex flex-col shrink-0 relative z-20 ${className}`} style={style}>
      {/* Header */}
      <div className="h-12 border-b border-slate-800 flex items-center px-4 shrink-0 bg-slate-950">
        <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <Bot className="w-4 h-4 text-blue-400" />
          AI アシスタント
        </h2>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto custom-scrollbar relative">
        <ChatMessageList
          messages={messages}
          onSelectOption={() => {}}
          isGenerated={isGenerated}
        />
      </div>

      {/* Footer: Summary + Composer */}
      <div className="flex flex-col">
        <BriefSummaryCard
          briefDraft={briefDraft}
          onGenerate={onGenerate}
          isGenerated={isGenerated}
          isGenerateDisabled={isGenerateDisabled}
          isGenerateLoading={isGenerateLoading}
        />
        <ChatComposer
          onSend={onSendMessage}
          disabled={false}
          placeholder="追加の指示を入力..."
        />
      </div>
    </aside>
  );
}
