import React, { useEffect, useRef } from 'react';
import { ChatMessage, StyleOption } from '../types/domain';
import ChatMessageBubble from './ChatMessageBubble';

interface ChatMessageListProps {
  messages: ChatMessage[];
  onSelectOption: (option: StyleOption) => void;
  isGenerated: boolean;
}

export default function ChatMessageList({ messages, onSelectOption, isGenerated }: ChatMessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerated]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar bg-slate-900">
      {messages.map((msg) => (
        <ChatMessageBubble 
          key={msg.id} 
          message={msg} 
          onSelectOption={onSelectOption} 
          isGenerated={isGenerated} 
        />
      ))}
      <div ref={bottomRef} className="h-2" />
    </div>
  );
}
