import React from 'react';
import { MousePointer2, Type, Square, Image as ImageIcon, Undo2, Redo2, ZoomIn, ZoomOut, Play } from 'lucide-react';

export default function TopCanvasToolbar() {
  return (
    <div className="h-12 border-b border-slate-800 bg-slate-900 flex items-center justify-between px-4 shrink-0 z-10">
      {/* Tools */}
      <div className="flex items-center gap-1">
        <ToolButton icon={MousePointer2} label="選択" active />
        <div className="w-px h-4 bg-slate-800 mx-2" />
        <ToolButton icon={Type} label="テキスト" />
        <ToolButton icon={Square} label="シェイプ" />
        <ToolButton icon={ImageIcon} label="画像" />
      </div>

      {/* History & Zoom */}
      <div className="flex items-center gap-1">
        <ToolButton icon={Undo2} label="元に戻す" disabled />
        <ToolButton icon={Redo2} label="やり直し" disabled />
        <div className="w-px h-4 bg-slate-800 mx-2" />
        <ToolButton icon={ZoomOut} label="縮小" />
        <span className="text-[11px] font-medium text-slate-400 w-12 text-center">100%</span>
        <ToolButton icon={ZoomIn} label="拡大" />
      </div>

      {/* Play */}
      <div className="flex items-center">
        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] font-medium transition-colors border border-slate-700">
          <Play className="w-3 h-3 text-emerald-400" />
          プレビュー
        </button>
      </div>
    </div>
  );
}

function ToolButton({ icon: Icon, label, active, disabled }: { icon: any, label: string, active?: boolean, disabled?: boolean }) {
  return (
    <button
      disabled={disabled}
      title={label}
      className={`p-1.5 rounded transition-colors ${
        active 
          ? 'bg-blue-600/20 text-blue-400' 
          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400'
      }`}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}
