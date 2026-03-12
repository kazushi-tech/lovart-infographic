import React, { useState } from 'react';
import { ElementData, SlideData } from '../types/domain';
import DownloadActions from './DownloadActions';
import { Settings2, Type, Layout, Database, AlertCircle, Info, FileImage, Layers } from 'lucide-react';

interface RightInspectorPanelProps {
  activeSlide: SlideData | null;
  selectedElement: ElementData | null;
  onUpdateElement: (id: string, updates: Partial<ElementData>) => void;
  onSelectElement: (id: string) => void;
}

export default function RightInspectorPanel({
  activeSlide,
  selectedElement,
  onUpdateElement,
  onSelectElement,
}: RightInspectorPanelProps) {
  const [activeTab, setActiveTab] = useState<'text' | 'layout' | 'data'>('text');

  if (!activeSlide) {
    return (
      <aside className="w-72 h-full border-l border-slate-800 bg-slate-900 flex flex-col shrink-0">
        <div className="h-12 border-b border-slate-800 flex items-center px-4 shrink-0">
          <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">インスペクタ</h2>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-500 space-y-3">
          <Settings2 className="w-8 h-8 opacity-20" />
          <p className="text-[11px]">スライドを生成すると、<br/>ここに設定が表示されます</p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-72 h-full border-l border-slate-800 bg-slate-900 flex flex-col shrink-0">
      {/* Header */}
      <div className="h-12 border-b border-slate-800 flex items-center px-4 shrink-0">
        <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          {selectedElement ? '要素の編集' : 'スライド設定'}
        </h2>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {selectedElement ? (
          <>
            {/* Tabs */}
            <div className="flex border-b border-slate-800">
              <TabButton active={activeTab === 'text'} onClick={() => setActiveTab('text')} icon={Type} label="テキスト" />
              <TabButton active={activeTab === 'layout'} onClick={() => setActiveTab('layout')} icon={Layout} label="配置" />
              <TabButton active={activeTab === 'data'} onClick={() => setActiveTab('data')} icon={Database} label="データ" />
            </div>

            {/* Tab Content */}
            <div className="p-4 space-y-5">
              {activeTab === 'text' && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-medium text-slate-400 uppercase tracking-wider">内容</label>
                    <textarea
                      value={selectedElement.content}
                      onChange={(e) => onUpdateElement(selectedElement.id, { content: e.target.value })}
                      className="w-full h-24 bg-slate-950 border border-slate-700 rounded p-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-medium text-slate-400 uppercase tracking-wider">フォントサイズ</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="8"
                        max="120"
                        value={selectedElement.fontSize || 16}
                        onChange={(e) => onUpdateElement(selectedElement.id, { fontSize: parseInt(e.target.value) })}
                        className="flex-1 accent-blue-500"
                      />
                      <span className="text-xs text-slate-300 w-8 text-right">{selectedElement.fontSize}px</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-medium text-slate-400 uppercase tracking-wider">カラー</label>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-6 h-6 rounded border border-slate-700" 
                        style={{ backgroundColor: selectedElement.color || '#FFFFFF' }}
                      />
                      <input
                        type="text"
                        value={selectedElement.color || '#FFFFFF'}
                        onChange={(e) => onUpdateElement(selectedElement.id, { color: e.target.value })}
                        className="flex-1 bg-slate-950 border border-slate-700 rounded p-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-medium text-slate-400 uppercase tracking-wider">フォントウェイト</label>
                    <div className="flex bg-slate-950 border border-slate-700 rounded p-1">
                      <button
                        onClick={() => onUpdateElement(selectedElement.id, { fontWeight: 'normal' })}
                        className={`flex-1 py-1 text-xs rounded transition-colors ${(!selectedElement.fontWeight || selectedElement.fontWeight === 'normal') ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-300'}`}
                      >
                        標準
                      </button>
                      <button
                        onClick={() => onUpdateElement(selectedElement.id, { fontWeight: 'bold' })}
                        className={`flex-1 py-1 text-xs rounded transition-colors font-bold ${selectedElement.fontWeight === 'bold' || selectedElement.fontWeight === '700' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-300'}`}
                      >
                        太字
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-medium text-slate-400 uppercase tracking-wider">テキスト配置</label>
                    <div className="flex bg-slate-950 border border-slate-700 rounded p-1">
                      <button
                        onClick={() => onUpdateElement(selectedElement.id, { textAlign: 'left' })}
                        className={`flex-1 py-1 text-xs rounded transition-colors ${(!selectedElement.textAlign || selectedElement.textAlign === 'left') ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-300'}`}
                      >
                        左
                      </button>
                      <button
                        onClick={() => onUpdateElement(selectedElement.id, { textAlign: 'center' })}
                        className={`flex-1 py-1 text-xs rounded transition-colors ${selectedElement.textAlign === 'center' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-300'}`}
                      >
                        中央
                      </button>
                      <button
                        onClick={() => onUpdateElement(selectedElement.id, { textAlign: 'right' })}
                        className={`flex-1 py-1 text-xs rounded transition-colors ${selectedElement.textAlign === 'right' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-300'}`}
                      >
                        右
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'layout' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-medium text-slate-400 uppercase tracking-wider">X 座標 (%)</label>
                      <input
                        type="number"
                        value={selectedElement.x}
                        onChange={(e) => onUpdateElement(selectedElement.id, { x: parseInt(e.target.value) })}
                        className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-medium text-slate-400 uppercase tracking-wider">Y 座標 (%)</label>
                      <input
                        type="number"
                        value={selectedElement.y}
                        onChange={(e) => onUpdateElement(selectedElement.id, { y: parseInt(e.target.value) })}
                        className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'data' && (
                <div className="p-3 bg-slate-950 border border-slate-800 rounded text-[11px] text-slate-400">
                  <p>この要素タイプ ({selectedElement.type}) には構造化データはありません。</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="p-4 space-y-6">
            {/* Slide Info */}
            <div className="space-y-3">
              <h3 className="text-[10px] font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileImage className="w-3.5 h-3.5" />
                スライド情報
              </h3>
              <div className="p-3 bg-slate-950 border border-slate-800 rounded space-y-2">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-500">タイトル</span>
                  <span className="text-slate-300 font-medium truncate max-w-[120px]" title={activeSlide.title}>{activeSlide.title}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-500">ページ番号</span>
                  <span className="text-slate-300">{activeSlide.pageNumber}</span>
                </div>
                {activeSlide.pageKind && (
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-500">ページ種別</span>
                    <span className="text-slate-300">{activeSlide.pageKind}</span>
                  </div>
                )}
                {activeSlide.eyebrow && (
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-500">セクション</span>
                    <span className="text-slate-300 truncate max-w-[120px]" title={activeSlide.eyebrow}>{activeSlide.eyebrow}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Editable Elements List */}
            <div className="space-y-3">
              <h3 className="text-[10px] font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                編集可能な要素 ({activeSlide.elements.length})
              </h3>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                キャンバス上のテキストをクリックするか、以下のリストから選択して編集できます。
              </p>
              <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-1">
                {activeSlide.elements.map(el => (
                  <button
                    key={el.id}
                    onClick={() => onSelectElement(el.id)}
                    className="w-full text-left p-2.5 bg-slate-950 border border-slate-800 hover:border-slate-600 rounded flex items-start gap-2 transition-colors group"
                  >
                    <Type className="w-3.5 h-3.5 text-slate-500 mt-0.5 shrink-0 group-hover:text-blue-400" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] text-slate-300 truncate">{el.content.split('\n')[0]}</p>
                      <p className="text-[9px] text-slate-500 mt-0.5">{el.type.toUpperCase()}</p>
                    </div>
                  </button>
                ))}
                {activeSlide.elements.length === 0 && (
                  <div className="p-3 text-center text-[11px] text-slate-500 border border-slate-800 border-dashed rounded">
                    編集可能な要素はありません
                  </div>
                )}
              </div>
            </div>

            {/* Export Status */}
            <div className="space-y-3">
              <h3 className="text-[10px] font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" />
                エクスポート状態
              </h3>
              <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">ステータス</span>
                  <span className="text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    準備完了
                  </span>
                </div>
              </div>
            </div>

            {/* Downloads */}
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <h3 className="text-[10px] font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                ダウンロード
              </h3>
              <DownloadActions hasSlides={true} />
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

function TabButton({ active, onClick, icon: Icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-medium border-b-2 transition-colors ${
        active 
          ? 'border-blue-500 text-blue-400 bg-blue-500/5' 
          : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  );
}
