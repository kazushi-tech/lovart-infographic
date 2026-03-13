/**
 * Layout templates per pageKind.
 * Each template defines named slots with position/size hints.
 * The layoutCompiler maps semantic data into these slots.
 */

import type { PageKind } from '../demoData';

export interface SlotDef {
  /** Slot purpose identifier */
  name: string;
  x: number;
  y: number;
  width?: number;
}

export interface LayoutTemplate {
  pageKind: PageKind;
  slots: SlotDef[];
}

// ─── Cover ────────────────────────────────────────
const cover: LayoutTemplate = {
  pageKind: 'cover',
  slots: [
    { name: 'eyebrow', x: 8, y: 18 },
    { name: 'headline', x: 8, y: 26, width: 70 },
    { name: 'subheadline', x: 8, y: 42, width: 60 },
    { name: 'kpi-0', x: 8, y: 60 },
    { name: 'sourceNote', x: 8, y: 90 },
  ],
};

// ─── Executive Summary ────────────────────────────
const executiveSummary: LayoutTemplate = {
  pageKind: 'executive-summary',
  slots: [
    { name: 'eyebrow', x: 6, y: 8 },
    { name: 'headline', x: 6, y: 14, width: 80 },
    { name: 'kpi-0', x: 6, y: 30 },
    { name: 'kpi-1', x: 35, y: 30 },
    { name: 'fact-0', x: 6, y: 55, width: 85 },
    { name: 'fact-1', x: 6, y: 63, width: 85 },
    { name: 'sourceNote', x: 6, y: 92 },
  ],
};

// ─── Problem Analysis ─────────────────────────────
const problemAnalysis: LayoutTemplate = {
  pageKind: 'problem-analysis',
  slots: [
    { name: 'eyebrow', x: 6, y: 8 },
    { name: 'headline', x: 6, y: 14, width: 80 },
    { name: 'kpi-0', x: 6, y: 28 },
    { name: 'kpi-1', x: 35, y: 28 },
    { name: 'section-0', x: 6, y: 48, width: 42 },
    { name: 'section-1', x: 52, y: 48, width: 42 },
    { name: 'fact-0', x: 6, y: 78, width: 85 },
    { name: 'sourceNote', x: 6, y: 92 },
  ],
};

// ─── Comparison ───────────────────────────────────
const comparison: LayoutTemplate = {
  pageKind: 'comparison',
  slots: [
    { name: 'eyebrow', x: 6, y: 8 },
    { name: 'headline', x: 6, y: 14, width: 80 },
    { name: 'comparisonHeader', x: 6, y: 30, width: 88 },
    { name: 'comparisonRow-0', x: 6, y: 40, width: 88 },
    { name: 'comparisonRow-1', x: 6, y: 52, width: 88 },
    { name: 'comparisonRow-2', x: 6, y: 64, width: 88 },
    { name: 'sourceNote', x: 6, y: 92 },
  ],
};

// ─── Roadmap ──────────────────────────────────────
const roadmap: LayoutTemplate = {
  pageKind: 'roadmap',
  slots: [
    { name: 'eyebrow', x: 6, y: 8 },
    { name: 'headline', x: 6, y: 14, width: 80 },
    { name: 'roadmapPhase-0', x: 6, y: 32, width: 27 },
    { name: 'roadmapPhase-1', x: 36, y: 32, width: 27 },
    { name: 'roadmapPhase-2', x: 66, y: 32, width: 27 },
    { name: 'sourceNote', x: 6, y: 92 },
  ],
};

// ─── Deep Dive ────────────────────────────────────
const deepDive: LayoutTemplate = {
  pageKind: 'deep-dive',
  slots: [
    { name: 'eyebrow', x: 6, y: 8 },
    { name: 'headline', x: 6, y: 14, width: 80 },
    { name: 'kpi-0', x: 6, y: 28 },
    { name: 'kpi-1', x: 35, y: 28 },
    { name: 'section-0', x: 6, y: 48, width: 42 },
    { name: 'section-1', x: 52, y: 48, width: 42 },
    { name: 'fact-0', x: 6, y: 80, width: 85 },
    { name: 'sourceNote', x: 6, y: 92 },
  ],
};

// ─── Decision CTA ─────────────────────────────────
const decisionCta: LayoutTemplate = {
  pageKind: 'decision-cta',
  slots: [
    { name: 'eyebrow', x: 6, y: 8 },
    { name: 'headline', x: 6, y: 14, width: 80 },
    { name: 'takeaway-0', x: 6, y: 30, width: 85 },
    { name: 'takeaway-1', x: 6, y: 38, width: 85 },
    { name: 'takeaway-2', x: 6, y: 46, width: 85 },
    { name: 'actionItem-0', x: 6, y: 60, width: 27 },
    { name: 'actionItem-1', x: 36, y: 60, width: 27 },
    { name: 'actionItem-2', x: 66, y: 60, width: 27 },
    { name: 'sourceNote', x: 6, y: 92 },
  ],
};

export const LAYOUT_TEMPLATES: Record<PageKind, LayoutTemplate> = {
  'cover': cover,
  'executive-summary': executiveSummary,
  'problem-analysis': problemAnalysis,
  'comparison': comparison,
  'roadmap': roadmap,
  'deep-dive': deepDive,
  'decision-cta': decisionCta,
};
