import React from 'react';
import { ChatMessage, StyleOption } from '../demoData';
import { Bot, User, Info } from 'lucide-react';

interface ChatMessageBubbleProps {
  key?: string;
  message: ChatMessage;
  onSelectOption?: (option: StyleOption) => void;
  isGenerated?: boolean;
}

export default function ChatMessageBubble({ message, onSelectOption, isGenerated }: ChatMessageBubbleProps) {
  if (message.role === 'system') {
    return (
      <div className="flex justify-center my-4">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-full px-4 py-1.5 flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-[11px] text-slate-400">{message.text}</span>
        </div>
      </div>
    );
  }

  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
        isUser ? 'bg-slate-700 text-slate-300' : 'bg-blue-600/20 text-blue-400'
      }`}>
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      {/* Message Content */}
      <div className={`flex flex-col gap-2 max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed shadow-sm ${
          isUser 
            ? 'bg-blue-600 text-white rounded-tr-sm' 
            : 'bg-slate-800 text-slate-200 rounded-tl-sm border border-slate-700/50'
        }`}>
          {message.text}
        </div>

        {/* Options (Chips/Grid/List) */}
        {message.inputMode === 'options' && message.options && (
          <div className={`mt-1 w-full ${message.optionsType === 'grid' ? 'grid grid-cols-2 gap-2' : 'flex flex-col gap-2'}`}>
            {message.options.map(opt => (
              <button
                key={opt.id}
                onClick={() => onSelectOption && onSelectOption(opt)}
                disabled={isGenerated || message.status === 'sent'}
                className={`text-left transition-all disabled:opacity-50 shadow-sm ${
                  message.optionsType === 'grid'
                    ? 'p-2 bg-slate-950 border border-slate-700 hover:border-blue-500 hover:bg-blue-500/10 rounded-lg flex flex-col gap-1'
                    : 'px-3 py-2 bg-slate-950 border border-slate-700 hover:border-blue-500 hover:bg-blue-500/10 text-slate-300 hover:text-blue-300 text-[12px] rounded-lg'
                }`}
              >
                {message.optionsType === 'grid' && opt.imageUrl && (
                  <div className="w-full aspect-video bg-slate-800 rounded overflow-hidden mb-1">
                    <img src={opt.imageUrl} alt={opt.label} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className={message.optionsType === 'grid' ? 'text-[11px] font-medium text-slate-200' : ''}>
                  {opt.label}
                </div>
                {opt.desc && message.optionsType === 'grid' && (
                  <div className="text-[9px] text-slate-500 leading-tight">
                    {opt.desc}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
