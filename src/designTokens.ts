/**
 * Design tokens for each slide template style.
 * Defines color palette, text colors, and overlay strategy per template.
 */

export type BackgroundMode = 'none' | 'cover-only' | 'all';

export interface DesignToken {
  id: string;
  label: string;
  /** Background overlay CSS class applied over the slide background image */
  overlayClass: string;
  /** Default text colors by hierarchy */
  colors: {
    eyebrow: string;
    headline: string;
    subheadline: string;
    body: string;
    kpiValue: string;
    kpiLabel: string;
    sourceNote: string;
    /** Card / surface background */
    cardBg: string;
    /** Card border */
    cardBorder: string;
    /** Muted text (used in secondary labels) */
    muted: string;
  };
  /** CSS text-shadow for readability over images */
  textShadow: string;
  /** Accent color for KPI highlights, badges, etc. */
  accent: string;
  /** Whether to use AI background images (false = CSS-only backgrounds) */
  useAiBackground: boolean;
  /** CSS fallback background when AI image is not used or fails */
  fallbackBg: string;
  /** Background image generation mode (M2) */
  backgroundMode?: BackgroundMode;
  /** Layout variant (M6 - to be implemented) */
  layoutVariant?: 'standard' | 'centered' | 'asymmetric';
}

export const DESIGN_TOKENS: Record<string, DesignToken> = {
  corporate: {
    id: 'corporate',
    label: 'Corporate（コーポレート）',
    overlayClass: 'bg-gradient-to-br from-white/90 via-white/70 to-slate-100/80',
    colors: {
      eyebrow: '#1E40AF',
      headline: '#0F172A',
      subheadline: '#334155',
      body: '#1E293B',
      kpiValue: '#1D4ED8',
      kpiLabel: '#475569',
      sourceNote: '#64748B',
      cardBg: 'rgba(241, 245, 249, 0.7)',
      cardBorder: 'rgba(30, 64, 175, 0.12)',
      muted: '#64748B',
    },
    textShadow: 'none',
    accent: '#2563EB',
    useAiBackground: false,
    fallbackBg: 'linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 50%, #DBEAFE 100%)',
    backgroundMode: 'none',
  },
  professional: {
    id: 'professional',
    label: 'Professional（プロフェッショナル）',
    overlayClass: 'bg-gradient-to-br from-slate-50/90 via-slate-100/75 to-blue-50/80',
    colors: {
      eyebrow: '#2563EB',
      headline: '#0F172A',
      subheadline: '#475569',
      body: '#1E293B',
      kpiValue: '#1E40AF',
      kpiLabel: '#475569',
      sourceNote: '#64748B',
      cardBg: 'rgba(248, 250, 252, 0.6)',
      cardBorder: 'rgba(59, 130, 246, 0.1)',
      muted: '#64748B',
    },
    textShadow: 'none',
    accent: '#3B82F6',
    useAiBackground: false,
    fallbackBg: 'linear-gradient(135deg, #F1F5F9 0%, #E0E7FF 50%, #EFF6FF 100%)',
    backgroundMode: 'none',
  },
  executive: {
    id: 'executive',
    label: 'Executive（エグゼクティブ）',
    overlayClass: 'bg-gradient-to-br from-slate-950/90 via-slate-900/80 to-slate-950/90',
    colors: {
      eyebrow: '#F59E0B',
      headline: '#F8FAFC',
      subheadline: '#CBD5E1',
      body: '#E2E8F0',
      kpiValue: '#FBBF24',
      kpiLabel: '#94A3B8',
      sourceNote: '#64748B',
      cardBg: 'rgba(15, 23, 42, 0.6)',
      cardBorder: 'rgba(245, 158, 11, 0.15)',
      muted: '#94A3B8',
    },
    textShadow: '0 1px 3px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3)',
    accent: '#F59E0B',
    useAiBackground: true,
    fallbackBg: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)',
    backgroundMode: 'cover-only',
  },
  modern: {
    id: 'modern',
    label: 'Modern（モダン）',
    overlayClass: 'bg-gradient-to-br from-indigo-950/85 via-purple-900/70 to-slate-950/85',
    colors: {
      eyebrow: '#A78BFA',
      headline: '#FFFFFF',
      subheadline: '#C4B5FD',
      body: '#E2E8F0',
      kpiValue: '#818CF8',
      kpiLabel: '#A5B4FC',
      sourceNote: '#94A3B8',
      cardBg: 'rgba(30, 27, 75, 0.5)',
      cardBorder: 'rgba(139, 92, 246, 0.15)',
      muted: '#94A3B8',
    },
    textShadow: '0 1px 3px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.2)',
    accent: '#8B5CF6',
    useAiBackground: true,
    fallbackBg: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #0F172A 100%)',
    backgroundMode: 'all',
  },
  minimal: {
    id: 'minimal',
    label: 'Minimal（ミニマル）',
    overlayClass: 'bg-white/95',
    colors: {
      eyebrow: '#64748B',
      headline: '#0F172A',
      subheadline: '#475569',
      body: '#334155',
      kpiValue: '#0F172A',
      kpiLabel: '#64748B',
      sourceNote: '#94A3B8',
      cardBg: 'rgba(248, 250, 252, 0.8)',
      cardBorder: 'rgba(15, 23, 42, 0.08)',
      muted: '#94A3B8',
    },
    textShadow: 'none',
    accent: '#0F172A',
    useAiBackground: false,
    fallbackBg: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
    backgroundMode: 'none',
  },
};

/** Fallback token when style is unknown */
export const DEFAULT_TOKEN = DESIGN_TOKENS.professional;

export function getDesignToken(styleId: string | undefined): DesignToken {
  if (!styleId) return DEFAULT_TOKEN;
  return DESIGN_TOKENS[styleId] || DEFAULT_TOKEN;
}
