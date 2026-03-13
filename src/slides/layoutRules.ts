/**
 * Layout rules: typography scale, spacing constants, and shared constraints.
 * These enforce visual hierarchy and prevent cluttered slides.
 */

// --- Typography scale (px) ---
export const FONT = {
  eyebrow: 14,
  headline: 36,
  headlineCover: 42,
  subheadline: 18,
  body: 16,
  kpiValue: 48,
  kpiLabel: 13,
  kpiUnit: 20,
  sectionTitle: 18,
  bullet: 15,
  sourceNote: 11,
  badge: 12,
  chip: 13,
  comparisonHeader: 14,
  comparisonCell: 14,
  roadmapTitle: 15,
  roadmapBullet: 13,
  actionItem: 15,
} as const;

// --- Spacing (%) ---
export const SPACING = {
  /** Left/right margin */
  marginX: 6,
  /** Top margin below header */
  marginTop: 8,
  /** Gap between major sections (eyebrow→headline, headline→body) */
  sectionGap: 4,
  /** Gap between inline items (e.g., KPI cards side by side) */
  itemGap: 2,
  /** Bottom margin / source note area */
  marginBottom: 6,
} as const;

// --- Content limits ---
export const LIMITS = {
  maxKpis: 2,
  maxFacts: 3,
  maxSections: 3,
  maxBulletsPerSection: 3,
  maxComparisonRows: 3,
  maxRoadmapPhases: 3,
  maxActionItems: 3,
  maxTakeaways: 3,
} as const;

// --- Font weight presets ---
export const WEIGHT = {
  eyebrow: '600',
  headline: '700',
  subheadline: '400',
  body: '400',
  kpiValue: '700',
  kpiLabel: '400',
  sectionTitle: '600',
  sourceNote: '400',
} as const;
