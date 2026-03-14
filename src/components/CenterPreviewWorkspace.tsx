import React, { useState, useRef, useEffect } from 'react';
import { SlideData, ElementData } from '../demoData';
import TopCanvasToolbar from './TopCanvasToolbar';
import { ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import { DesignToken, DEFAULT_TOKEN } from '../designTokens';

interface CenterPreviewWorkspaceProps {
  activeSlide: SlideData | null;
  totalSlides: number;
  selectedElementId: string | null;
  onSelectElement: (id: string | null) => void;
  onUpdateElement: (id: string, updates: Partial<ElementData>) => void;
  onNext: () => void;
  onPrev: () => void;
  designToken?: DesignToken;
  zoom?: number;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

export default function CenterPreviewWorkspace({
  activeSlide,
  totalSlides,
  selectedElementId,
  onSelectElement,
  onUpdateElement,
  onNext,
  onPrev,
  designToken = DEFAULT_TOKEN,
  zoom = 100,
  onZoomIn,
  onZoomOut,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
}: CenterPreviewWorkspaceProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  if (!activeSlide) {
    return (
      <div className="flex-1 flex flex-col bg-slate-950 text-slate-500 relative">
        <TopCanvasToolbar zoom={zoom} />
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-900/50 flex items-center justify-center mb-4 border border-slate-800/50">
            <Maximize2 className="w-6 h-6 text-slate-600" />
          </div>
          <p className="text-sm font-medium">スライドが生成されていません</p>
          <p className="text-xs mt-1">左側のパネルからテーマを入力して生成を開始してください</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-950 relative overflow-hidden">
      <TopCanvasToolbar
        zoom={zoom}
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
        onUndo={onUndo}
        onRedo={onRedo}
        canUndo={canUndo}
        canRedo={canRedo}
      />

      {/* Header Info */}
      <header className="absolute top-14 left-0 right-0 h-12 flex items-center justify-between px-6 z-10 pointer-events-none">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-semibold text-slate-200 truncate max-w-md drop-shadow-md">
            {activeSlide.title}
          </h1>
          <span className="px-2 py-0.5 rounded bg-slate-900/80 border border-slate-700/50 text-[10px] font-medium text-slate-400 backdrop-blur-sm">
            {activeSlide.pageNumber} / {totalSlides}
          </span>
        </div>

        <div className="flex items-center gap-1.5 pointer-events-auto">
          <button
            onClick={onPrev}
            disabled={activeSlide.pageNumber === 1}
            className="p-1.5 rounded bg-slate-900/80 border border-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-slate-900/80 transition-colors backdrop-blur-sm shadow-sm"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={onNext}
            disabled={activeSlide.pageNumber === totalSlides}
            className="p-1.5 rounded bg-slate-900/80 border border-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-slate-900/80 transition-colors backdrop-blur-sm shadow-sm"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Canvas Area */}
      <main 
        className="flex-1 relative flex items-center justify-center p-8 overflow-auto bg-slate-950"
        onClick={() => onSelectElement(null)} // Click outside to deselect
      >
        {/* Aspect Ratio Container (16:9) */}
        <div 
          ref={containerRef}
          style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center center' }}
          className="relative w-full max-w-5xl aspect-video bg-slate-900 shadow-2xl ring-1 ring-slate-800 overflow-hidden transition-transform duration-150"
          onClick={(e) => e.stopPropagation()} // Prevent deselection when clicking canvas background
        >
          {/* Fallback CSS background (always present) */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: designToken.fallbackBg }}
          />

          {/* Background Image (layered on top of fallback) */}
          {activeSlide.imageUrl && (
            <img
              src={activeSlide.imageUrl}
              alt={activeSlide.title}
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              referrerPolicy="no-referrer"
            />
          )}

          {/* Overlay for readability — driven by design token */}
          <div className={`absolute inset-0 pointer-events-none ${designToken.overlayClass}`} />

          {/* Elements Overlay */}
          <div className="absolute inset-0">
            {activeSlide.elements.map((el) => (
              <RenderElement
                key={el.id}
                element={el}
                isSelected={selectedElementId === el.id}
                onSelect={() => onSelectElement(el.id)}
                onUpdate={(updates) => onUpdateElement(el.id, updates)}
                containerRef={containerRef}
                textShadow={designToken.textShadow}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

// Helper to render individual elements
function RenderElement({
  element,
  isSelected,
  onSelect,
  onUpdate,
  containerRef,
  textShadow = 'none',
}: {
  key?: string;
  element: ElementData;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<ElementData>) => void;
  containerRef: React.RefObject<HTMLDivElement>;
  textShadow?: string;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialPos, setInitialPos] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setInitialPos({ x: element.x, y: element.y });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const dx = ((e.clientX - dragStart.x) / containerRect.width) * 100;
      const dy = ((e.clientY - dragStart.y) / containerRect.height) * 100;

      let newX = initialPos.x + dx;
      let newY = initialPos.y + dy;

      // Clamp to boundaries (approximate)
      newX = Math.max(0, Math.min(newX, 100));
      newY = Math.max(0, Math.min(newY, 100));

      onUpdate({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart, initialPos, onUpdate, containerRef]);

  // Base styles
  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${element.x}%`,
    top: `${element.y}%`,
    width: element.width ? `${element.width}%` : 'auto',
    color: element.color || '#FFFFFF',
    fontSize: `${element.fontSize || 16}px`,
    fontWeight: element.fontWeight || 'normal',
    textAlign: element.textAlign || 'left',
    whiteSpace: 'pre-wrap',
    cursor: isDragging ? 'grabbing' : 'grab',
    padding: '4px 8px',
    marginLeft: '-8px',
    marginTop: '-4px',
    borderRadius: '4px',
    transition: isDragging ? 'none' : 'all 0.2s ease',
    userSelect: 'none',
    textShadow,
  };

  // Selection & Hover styles
  const interactionClasses = isSelected 
    ? 'ring-2 ring-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/20 z-10' 
    : 'hover:ring-1 hover:ring-dashed hover:ring-slate-400 hover:bg-white/5 z-0';

  // --- Badge (eyebrow) ---
  if (element.type === 'badge') {
    return (
      <div
        style={{
          ...style,
          backgroundColor: element.background || 'rgba(37, 99, 235, 0.1)',
          border: `1px solid ${element.borderColor || 'rgba(37, 99, 235, 0.25)'}`,
          borderRadius: '6px',
          padding: '4px 12px',
          display: 'inline-block',
          letterSpacing: '0.05em',
        }}
        className={interactionClasses}
        onMouseDown={handleMouseDown}
      >
        {element.content}
      </div>
    );
  }

  // --- KPI ---
  if (element.type === 'kpi') {
    const lines = element.content.split('\n');
    const label = lines[0] || '';
    const value = lines[1] || '';
    return (
      <div
        style={{ ...style, padding: '12px 16px' }}
        className={interactionClasses}
        onMouseDown={handleMouseDown}
      >
        <div style={{ fontSize: `${(element.fontSize || 48)}px`, color: element.color, fontWeight: '700', lineHeight: 1.1 }}>
          {value}
        </div>
        <div style={{ fontSize: '13px', color: element.color, opacity: 0.7, marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {label}
        </div>
      </div>
    );
  }

  // --- Card (section with title + bullets) ---
  if (element.type === 'card') {
    return (
      <div
        style={{
          ...style,
          backgroundColor: 'rgba(15, 23, 42, 0.5)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '8px',
          padding: '14px 16px',
        }}
        className={interactionClasses}
        onMouseDown={handleMouseDown}
      >
        {element.content.split('\n').map((line, i) => (
          <div key={i} style={{
            fontWeight: i === 0 ? '600' : '400',
            fontSize: i === 0 ? `${(element.fontSize || 15) + 2}px` : `${element.fontSize || 15}px`,
            marginTop: i === 0 ? 0 : '4px',
            opacity: i === 0 ? 1 : 0.85,
          }}>
            {line}
          </div>
        ))}
      </div>
    );
  }

  // --- Bullet list ---
  if (element.type === 'bullet-list') {
    return (
      <div
        style={{ ...style, display: 'flex', alignItems: 'flex-start', gap: '8px' }}
        className={interactionClasses}
        onMouseDown={handleMouseDown}
      >
        <span style={{ color: element.color, opacity: 0.5, fontSize: '20px', lineHeight: 1 }}>•</span>
        <span>{element.content}</span>
      </div>
    );
  }

  // --- Comparison row ---
  if (element.type === 'comparison-row') {
    const cells = element.content.split('\t');
    const isHeader = element.variant === 'header';
    return (
      <div
        style={{
          ...style,
          display: 'grid',
          gridTemplateColumns: '1.2fr 1fr 1fr',
          gap: '12px',
          backgroundColor: element.background || (isHeader ? 'rgba(15, 23, 42, 0.4)' : 'rgba(15, 23, 42, 0.25)'),
          borderRadius: '6px',
          padding: '10px 16px',
          borderBottom: `1px solid ${element.borderColor || 'rgba(255,255,255,0.06)'}`,
        }}
        className={interactionClasses}
        onMouseDown={handleMouseDown}
      >
        {cells.map((cell, i) => (
          <div key={i} style={{
            fontWeight: isHeader || i === 0 ? '600' : '400',
            textAlign: i === 0 ? 'left' : 'center',
          }}>
            {cell}
          </div>
        ))}
      </div>
    );
  }

  // --- Roadmap step ---
  if (element.type === 'roadmap-step') {
    const lines = element.content.split('\n');
    const title = lines[0] || '';
    const bullets = lines.slice(1);
    return (
      <div
        style={{
          ...style,
          backgroundColor: element.background || 'rgba(15, 23, 42, 0.4)',
          borderRadius: '10px',
          padding: '16px',
          borderTop: `3px solid ${element.borderColor || '#3B82F6'}`,
        }}
        className={interactionClasses}
        onMouseDown={handleMouseDown}
      >
        <div style={{ fontWeight: '700', fontSize: `${(element.fontSize || 13) + 2}px`, marginBottom: '8px' }}>
          {title}
        </div>
        {bullets.map((b, i) => (
          <div key={i} style={{ fontSize: `${element.fontSize || 13}px`, opacity: 0.85, marginTop: '3px' }}>
            {b}
          </div>
        ))}
      </div>
    );
  }

  // --- Chip ---
  if (element.type === 'chip') {
    return (
      <div
        style={{
          ...style,
          backgroundColor: element.background || 'rgba(37, 99, 235, 0.12)',
          border: `1px solid ${element.borderColor || 'rgba(37, 99, 235, 0.3)'}`,
          borderRadius: '8px',
          padding: '12px 16px',
          textAlign: 'center',
        }}
        className={interactionClasses}
        onMouseDown={handleMouseDown}
      >
        {element.content}
      </div>
    );
  }

  // --- Default text ---
  return (
    <div
      style={style}
      className={interactionClasses}
      onMouseDown={handleMouseDown}
    >
      {element.content}
    </div>
  );
}
