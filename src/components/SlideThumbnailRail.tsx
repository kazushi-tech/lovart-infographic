import React from 'react';
import { SlideData } from '../types/domain';

interface SlideThumbnailRailProps {
  slides: SlideData[];
  activeSlideId: string | null;
  onSelectSlide: (id: string) => void;
}

export default function SlideThumbnailRail({
  slides,
  activeSlideId,
  onSelectSlide,
}: SlideThumbnailRailProps) {
  if (slides.length === 0) return null;

  return (
    <div className="h-32 border-t border-slate-800 bg-slate-900 shrink-0 flex items-center px-4 overflow-x-auto custom-scrollbar">
      <div className="flex items-center gap-3 py-2 min-w-max">
        {slides.map((slide) => {
          const isActive = slide.id === activeSlideId;
          return (
            <button
              key={slide.id}
              onClick={() => onSelectSlide(slide.id)}
              className={`relative group flex flex-col items-center gap-1.5 transition-all outline-none ${
                isActive ? 'opacity-100' : 'opacity-60 hover:opacity-100'
              }`}
            >
              {/* Thumbnail Container */}
              <div
                className={`w-36 aspect-video rounded overflow-hidden border-2 transition-all shadow-md bg-slate-800 flex items-center justify-center ${
                  isActive
                    ? 'border-blue-500 shadow-blue-500/20'
                    : 'border-slate-700 group-hover:border-slate-500'
                }`}
              >
                {slide.imageUrl ? (
                  <img
                    src={slide.imageUrl}
                    alt={slide.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-4 h-4 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin" />
                )}
              </div>

              {/* Page Number Badge */}
              <div
                className={`absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shadow-sm transition-colors ${
                  isActive
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700 group-hover:text-slate-300'
                }`}
              >
                {slide.pageNumber}
              </div>

              {/* Title Truncated */}
              <span
                className={`text-[9px] font-medium max-w-[8rem] truncate transition-colors ${
                  isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'
                }`}
              >
                {slide.title}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
