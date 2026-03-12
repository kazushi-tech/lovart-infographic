/**
 * Design tokens for each slide template style.
 * Defines color palette, text colors, and overlay strategy per template.
 */

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
  };
  /** CSS text-shadow for readability over images */
  textShadow: string;
  /** Accent color for KPI highlights, badges, etc. */
  accent: string;
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
    },
    textShadow: 'none',
    accent: '#2563EB',
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
    },
    textShadow: 'none',
    accent: '#3B82F6',
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
    },
    textShadow: '0 1px 3px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3)',
    accent: '#F59E0B',
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
    },
    textShadow: '0 1px 3px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.2)',
    accent: '#8B5CF6',
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
    },
    textShadow: 'none',
    accent: '#0F172A',
  },
};

/** Fallback token when style is unknown */
export const DEFAULT_TOKEN = DESIGN_TOKENS.professional;

export function getDesignToken(styleId: string | undefined): DesignToken {
  if (!styleId) return DEFAULT_TOKEN;
  return DESIGN_TOKENS[styleId] || DEFAULT_TOKEN;
}
