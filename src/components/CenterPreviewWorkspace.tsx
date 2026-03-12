import React, { useState, useRef, useEffect } from 'react';
import { SlideData, ElementData } from '../types/domain';
import TopCanvasToolbar from './TopCanvasToolbar';
import { Maximize2 } from 'lucide-react';
import { DesignToken, DEFAULT_TOKEN } from '../designTokens';

interface CenterPreviewWorkspaceProps {
  slides: SlideData[];
  activeSlideId: string | null;
  selectedElementId: string | null;
  onSelectSlide: (id: string) => void;
  onSelectElement: (id: string | null) => void;
  onUpdateElement: (elementId: string, updates: Partial<ElementData>) => void;
  designToken?: DesignToken;
}

export default function CenterPreviewWorkspace({
  slides,
  activeSlideId,
  selectedElementId,
  onSelectSlide,
  onSelectElement,
  onUpdateElement,
  designToken = DEFAULT_TOKEN,
}: CenterPreviewWorkspaceProps) {
  const slideRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Scroll active slide into view when activeSlideId changes
  useEffect(() => {
    if (!activeSlideId) return;
    const el = slideRefs.current.get(activeSlideId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeSlideId]);

  if (slides.length === 0) {
    return (
      <div className="flex-1 flex flex-col bg-slate-950 text-slate-500 relative">
        <TopCanvasToolbar />
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
      <TopCanvasToolbar />

      {/* Scrollable slide list */}
      <main
        className="flex-1 overflow-y-auto p-6 space-y-6 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]"
        onClick={() => onSelectElement(null)}
      >
        {slides.map((slide) => {
          const isActive = slide.id === activeSlideId;
          return (
            <SlideCard
              key={slide.id}
              slide={slide}
              isActive={isActive}
              selectedElementId={isActive ? selectedElementId : null}
              onClickSlide={() => onSelectSlide(slide.id)}
              onSelectElement={(elementId) => {
                onSelectSlide(slide.id);
                onSelectElement(elementId);
              }}
              onUpdateElement={onUpdateElement}
              designToken={designToken}
              ref={(el) => {
                if (el) slideRefs.current.set(slide.id, el);
                else slideRefs.current.delete(slide.id);
              }}
            />
          );
        })}
      </main>
    </div>
  );
}

// Individual slide card with 16:9 ratio
const SlideCard = React.forwardRef<
  HTMLDivElement,
  {
    slide: SlideData;
    isActive: boolean;
    selectedElementId: string | null;
    onClickSlide: () => void;
    onSelectElement: (id: string | null) => void;
    onUpdateElement: (id: string, updates: Partial<ElementData>) => void;
    designToken: DesignToken;
  }
>(({ slide, isActive, selectedElementId, onClickSlide, onSelectElement, onUpdateElement, designToken }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={ref}
      className="w-full max-w-5xl mx-auto"
      onClick={(e) => {
        e.stopPropagation();
        onClickSlide();
        onSelectElement(null);
      }}
    >
      {/* Slide label */}
      <div className="flex items-center gap-2 mb-2">
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
          isActive ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400'
        }`}>
          {slide.pageNumber}
        </span>
        <span className={`text-xs font-medium truncate ${
          isActive ? 'text-slate-200' : 'text-slate-500'
        }`}>
          {slide.title}
        </span>
      </div>

      {/* 16:9 slide container */}
      <div
        ref={containerRef}
        className={`relative w-full aspect-video bg-slate-900 overflow-hidden rounded-lg transition-all ${
          isActive
            ? 'ring-2 ring-blue-500 shadow-lg shadow-blue-500/10'
            : 'ring-1 ring-slate-800 hover:ring-slate-700'
        }`}
      >
        {/* Background Image */}
        {slide.imageUrl && (
          <img
            src={slide.imageUrl}
            alt={slide.title}
            className="absolute inset-0 w-full h-full object-cover opacity-90 mix-blend-luminosity pointer-events-none"
            referrerPolicy="no-referrer"
          />
        )}

        {/* Overlay */}
        <div className={`absolute inset-0 pointer-events-none ${designToken.overlayClass}`} />

        {/* Elements */}
        <div className="absolute inset-0">
          {slide.elements.map((el) => (
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
    </div>
  );
});

SlideCard.displayName = 'SlideCard';

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
  containerRef: React.RefObject<HTMLDivElement | null>;
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

  const interactionClasses = isSelected
    ? 'ring-2 ring-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/20 z-10'
    : 'hover:ring-1 hover:ring-dashed hover:ring-slate-400 hover:bg-white/5 z-0';

  if (element.type === 'card') {
    return (
      <div
        style={{ ...style, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)' }}
        className={interactionClasses}
        onMouseDown={handleMouseDown}
      >
        {element.content}
      </div>
    );
  }

  if (element.type === 'kpi') {
    return (
      <div
        style={style}
        className={interactionClasses}
        onMouseDown={handleMouseDown}
      >
        <div className="text-blue-400 font-bold text-5xl leading-none mb-2">
          {element.content.split('\n')[1]}
        </div>
        <div className="text-sm text-slate-300 uppercase tracking-wider">
          {element.content.split('\n')[0]}
        </div>
      </div>
    );
  }

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
