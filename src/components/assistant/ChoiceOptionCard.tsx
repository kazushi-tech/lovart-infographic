import React from 'react';
import type { StepOption } from '../../interview/schema';

interface ChoiceOptionCardProps {
  option: StepOption;
  isSelected: boolean;
  onSelect: (option: StepOption) => void;
  disabled?: boolean;
  variant?: 'list' | 'grid';
}

export default function ChoiceOptionCard({
  option,
  isSelected,
  onSelect,
  disabled = false,
  variant = 'list',
}: ChoiceOptionCardProps) {
  const handleClick = () => {
    if (disabled) return;
    onSelect(option);
  };

  if (variant === 'grid') {
    return (
      <button
        onClick={handleClick}
        disabled={disabled}
        className={`text-left rounded-xl border overflow-hidden transition-all ${
          disabled ? 'opacity-60 cursor-not-allowed' :
          isSelected
            ? 'border-blue-500 bg-blue-500/10 ring-1 ring-blue-500/30'
            : 'border-slate-700 bg-slate-950 hover:border-slate-600 hover:bg-slate-900'
        }`}
      >
        {option.imageUrl && (
          <div className="h-24 overflow-hidden">
            <img src={option.imageUrl} alt={option.label} className="w-full h-full object-cover" />
          </div>
        )}
        <div className="p-3">
          <p className={`text-xs font-medium ${isSelected ? 'text-blue-300' : 'text-slate-200'}`}>
            {option.label}
          </p>
          {option.desc && (
            <p className="text-[10px] text-slate-500 mt-1">{option.desc}</p>
          )}
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`w-full text-left px-4 py-3 rounded-xl border transition-all flex items-center gap-3 ${
        disabled ? 'opacity-60 cursor-not-allowed' :
        isSelected
          ? 'border-blue-500 bg-blue-500/10 ring-1 ring-blue-500/30'
          : 'border-slate-700 bg-slate-950 hover:border-slate-600 hover:bg-slate-900'
      }`}
    >
      {/* Radio indicator */}
      <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${
        isSelected ? 'border-blue-500' : 'border-slate-600'
      }`}>
        {isSelected && <div className="w-2 h-2 rounded-full bg-blue-500" />}
      </div>
      <div className="min-w-0">
        <p className={`text-sm font-medium ${isSelected ? 'text-blue-300' : 'text-slate-200'}`}>
          {option.label}
        </p>
        {option.desc && (
          <p className="text-[10px] text-slate-500 mt-0.5">{option.desc}</p>
        )}
      </div>
    </button>
  );
}
