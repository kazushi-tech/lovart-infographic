/**
 * Compiled Prompt Panel Component
 *
 * コンパイルされたプロンプトを表示するパネル
 * BriefSummaryCard 内に統合されているため、このコンポーネントはスタンドアロンとして提供
 */

import React, { useState } from 'react';
import { Code, Copy, Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import { CompiledBrief } from '../brief/briefTypes';

interface CompiledPromptPanelProps {
  brief: CompiledBrief | null;
  isOpen?: boolean;
  onToggle?: () => void;
}

export default function CompiledPromptPanel({
  brief,
  isOpen = false,
  onToggle,
}: CompiledPromptPanelProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!brief) return;
    await navigator.clipboard.writeText(brief.promptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!brief) return null;

  return (
    <div className="bg-slate-900 border-t border-slate-800">
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-800/50 transition-colors"
      >
        <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <Code className="w-4 h-4 text-blue-400" />
          生成プロンプト
        </span>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-slate-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-500" />
        )}
      </button>

      {isOpen && (
        <div className="px-4 pb-4">
          <div className="bg-slate-950 border border-slate-700 rounded-lg overflow-hidden">
            <div className="px-3 py-2 border-b border-slate-800 flex items-center justify-between">
              <span className="text-[10px] text-slate-500 font-mono">
                {brief.promptText.split('\n').length} 行 / {brief.promptText.length} 文字
              </span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'コピーしました' : 'コピー'}
              </button>
            </div>
            <pre className="p-3 text-[11px] text-slate-300 whitespace-pre-wrap font-mono max-h-64 overflow-y-auto custom-scrollbar leading-relaxed">
              {brief.promptText}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
