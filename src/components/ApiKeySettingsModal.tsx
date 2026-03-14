import React, { useState, useEffect } from 'react';
import { X, Eye, EyeOff, Save, Trash2 } from 'lucide-react';

interface ApiKeySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialGeminiApiKey: string;
  initialImageApiKey: string;
  hasServerGeminiKey?: boolean;
  hasServerImageKey?: boolean;
  onSave: (geminiApiKey: string, imageApiKey: string) => void;
  onClear: () => void;
}

export default function ApiKeySettingsModal({
  isOpen,
  onClose,
  initialGeminiApiKey,
  initialImageApiKey,
  hasServerGeminiKey = false,
  hasServerImageKey = false,
  onSave,
  onClear,
}: ApiKeySettingsModalProps) {
  const [geminiApiKey, setGeminiApiKey] = useState(initialGeminiApiKey);
  const [imageApiKey, setImageApiKey] = useState(initialImageApiKey);
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showImageKey, setShowImageKey] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setGeminiApiKey(initialGeminiApiKey);
      setImageApiKey(initialImageApiKey);
    }
  }, [isOpen, initialGeminiApiKey, initialImageApiKey]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleSave = () => {
    onSave(geminiApiKey, imageApiKey);
    onClose();
  };

  const handleClear = () => {
    onClear();
    setGeminiApiKey('');
    setImageApiKey('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal Content */}
      <div
        className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h2 className="text-lg font-semibold text-slate-100">API Key 設定</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            aria-label="閉じる"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {(hasServerGeminiKey || hasServerImageKey) && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-2">
              <p className="text-xs text-emerald-200 leading-relaxed">
                サーバー側に
                {hasServerGeminiKey ? ' Gemini' : ''}
                {hasServerGeminiKey && hasServerImageKey ? ' /' : ''}
                {hasServerImageKey ? ' Image' : ''}
                {' '}API キーが設定済みです。空欄のままでも生成できます。
              </p>
            </div>
          )}
          {/* Gemini API Key */}
          <div className="space-y-2">
            <label htmlFor="gemini-key" className="block text-sm font-medium text-slate-300">
              Gemini API Key（構造生成）
            </label>
            <div className="relative">
              <input
                id="gemini-key"
                type={showGeminiKey ? 'text' : 'password'}
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 pr-10 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowGeminiKey(!showGeminiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                aria-label={showGeminiKey ? '非表示' : '表示'}
              >
                {showGeminiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-slate-500">
              スライド構造の生成に使用します（無料プラン可）
            </p>
          </div>

          {/* Image API Key */}
          <div className="space-y-2">
            <label htmlFor="image-key" className="block text-sm font-medium text-slate-300">
              Image API Key（画像生成）
            </label>
            <div className="relative">
              <input
                id="image-key"
                type={showImageKey ? 'text' : 'password'}
                value={imageApiKey}
                onChange={(e) => setImageApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 pr-10 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowImageKey(!showImageKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                aria-label={showImageKey ? '非表示' : '表示'}
              >
                {showImageKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-slate-500">
              背景画像の生成に使用します（有料プランが必要）
            </p>
          </div>

          {/* Warning */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
            <p className="text-xs text-amber-200">
              設定した API キーはブラウザ内に保存されます。共有端末では注意してください。
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-t border-slate-800">
          <button
            onClick={handleClear}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            クリア
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
            >
              キャンセル
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-500 rounded-lg transition-colors"
            >
              <Save className="w-4 h-4" />
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
