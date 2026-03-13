import React from 'react';
import { Bot, Sparkles } from 'lucide-react';

interface WizardWelcomeViewProps {
  onStartInterview: () => void;
  onSample: () => void;
}

export default function WizardWelcomeView({ onStartInterview, onSample }: WizardWelcomeViewProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6">
      <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center mb-6">
        <Bot className="w-8 h-8 text-blue-400" />
      </div>
      <h2 className="text-xl font-bold text-slate-100 mb-2">インフォグラフィックを作成</h2>
      <p className="text-sm text-slate-400 mb-8 text-center max-w-sm">
        いくつかの質問に答えるだけで、プロフェッショナルなスライドを自動生成します。
      </p>
      <div className="w-full max-w-sm space-y-3">
        <button
          onClick={onStartInterview}
          className="w-full text-left p-4 bg-slate-950 border border-slate-800 hover:border-blue-500/50 hover:bg-blue-500/5 rounded-xl flex items-center gap-3 transition-all group"
        >
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0 group-hover:bg-blue-500/20 transition-colors">
            <Bot className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-200">要件を入力する</p>
            <p className="text-[11px] text-slate-500 mt-0.5">対話形式で要件を定義します</p>
          </div>
        </button>
        <button
          onClick={onSample}
          className="w-full text-left p-4 bg-slate-950 border border-slate-800 hover:border-slate-600 hover:bg-slate-800/50 rounded-xl flex items-center gap-3 transition-all group"
        >
          <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center shrink-0 group-hover:bg-slate-700 transition-colors">
            <Sparkles className="w-5 h-5 text-slate-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-200">サンプルで試す</p>
            <p className="text-[11px] text-slate-500 mt-0.5">AI導入に関するデモデータで開始</p>
          </div>
        </button>
      </div>
    </div>
  );
}
