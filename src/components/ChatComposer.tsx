import React, { useState, KeyboardEvent } from 'react';
import { Send } from 'lucide-react';

interface ChatComposerProps {
  onSend: (text: string) => void;
  disabled: boolean;
  placeholder?: string;
}

export default function ChatComposer({ onSend, disabled, placeholder = "メッセージを入力..." }: ChatComposerProps) {
  const [text, setText] = useState('');

  const handleSend = () => {
    if (text.trim() && !disabled) {
      onSend(text.trim());
      setText('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-4 bg-slate-900 border-t border-slate-800 shrink-0">
      <div className="relative flex items-end gap-2 bg-slate-950 border border-slate-700 rounded-xl p-2 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={disabled ? "回答をお待ちしています" : placeholder}
          className="w-full max-h-32 min-h-[40px] bg-transparent text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none resize-none px-2 py-2.5 custom-scrollbar"
          rows={1}
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || disabled}
          className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 transition-colors shrink-0 mb-0.5"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
      <p className="text-[10px] text-slate-500 text-center mt-2">
        Enterで送信、Shift+Enterで改行
      </p>
    </div>
  );
}
