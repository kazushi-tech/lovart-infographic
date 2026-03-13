/**
 * Layout compiler: converts semantic slide data + design token into
 * deterministic ElementData[] using layout templates.
 *
 * This replaces the previous approach of asking the AI to place elements
 * with absolute coordinates.
 */

import type { SlideData, ElementData, ElementType, PageKind } from '../demoData';
import type { DesignToken } from '../designTokens';
import { DEFAULT_TOKEN } from '../designTokens';
import { LAYOUT_TEMPLATES } from './layoutTemplates';
import { FONT, WEIGHT, LIMITS } from './layoutRules';

let _idCounter = 0;
function nextId(slideId: string): string {
  return `${slideId}-el-${++_idCounter}`;
}

/**
 * Compile a single slide's semantic fields into positioned elements.
 * Falls back gracefully when optional fields are missing.
 */
export function compileSlideElements(
  slide: SlideData,
  token: DesignToken = DEFAULT_TOKEN,
): ElementData[] {
  _idCounter = 0;
  const kind: PageKind = slide.pageKind || 'deep-dive';
  const template = LAYOUT_TEMPLATES[kind];
  if (!template) return slide.elements ?? [];

  const elements: ElementData[] = [];
  const slot = (name: string) => template.slots.find(s => s.name === name);

  // --- Eyebrow (badge) ---
  if (slide.eyebrow) {
    const s = slot('eyebrow');
    if (s) {
      elements.push(el(slide.id, s, slide.eyebrow, {
        type: 'badge',
        fontSize: FONT.eyebrow,
        color: token.colors.eyebrow,
        fontWeight: WEIGHT.eyebrow,
        background: `${token.accent}18`,
        borderColor: `${token.accent}40`,
      }));
    }
  }

  // --- Headline ---
  if (slide.headline) {
    const s = slot('headline');
    if (s) {
      elements.push(el(slide.id, s, slide.headline, {
        fontSize: kind === 'cover' ? FONT.headlineCover : FONT.headline,
        color: token.colors.headline,
        fontWeight: WEIGHT.headline,
      }));
    }
  }

  // --- Subheadline (cover only) ---
  if (slide.subheadline) {
    const s = slot('subheadline');
    if (s) {
      elements.push(el(slide.id, s, slide.subheadline, {
        fontSize: FONT.subheadline,
        color: token.colors.subheadline,
        fontWeight: WEIGHT.subheadline,
      }));
    }
  }

  // --- KPIs ---
  const kpis = (slide.kpis ?? []).slice(0, LIMITS.maxKpis);
  kpis.forEach((kpi, i) => {
    const s = slot(`kpi-${i}`);
    if (s) {
      elements.push(el(slide.id, s, `${kpi.label}\n${kpi.value}${kpi.unit}`, {
        type: 'kpi',
        fontSize: FONT.kpiValue,
        color: token.colors.kpiValue,
        fontWeight: WEIGHT.kpiValue,
      }));
    }
  });

  // --- Facts (bullet-list) ---
  const facts = (slide.facts ?? []).slice(0, LIMITS.maxFacts);
  facts.forEach((fact, i) => {
    const s = slot(`fact-${i}`);
    if (s) {
      elements.push(el(slide.id, s, fact, {
        type: 'bullet-list',
        fontSize: FONT.body,
        color: token.colors.body,
        fontWeight: WEIGHT.body,
      }));
    }
  });

  // --- Sections ---
  const sections = (slide.sections ?? []).slice(0, LIMITS.maxSections);
  sections.forEach((sec, i) => {
    const s = slot(`section-${i}`);
    if (s) {
      const bullets = sec.bullets.slice(0, LIMITS.maxBulletsPerSection);
      const content = `${sec.title}\n${bullets.map(b => `  • ${b}`).join('\n')}`;
      elements.push(el(slide.id, s, content, {
        type: 'card',
        fontSize: FONT.bullet,
        color: token.colors.body,
        fontWeight: WEIGHT.body,
      }));
    }
  });

  // --- Comparison rows ---
  if (kind === 'comparison') {
    const headerSlot = slot('comparisonHeader');
    if (headerSlot) {
      elements.push(el(slide.id, headerSlot, '項目\t現状\t将来', {
        type: 'comparison-row',
        fontSize: FONT.comparisonHeader,
        color: token.colors.eyebrow,
        fontWeight: '700',
        variant: 'header',
        background: `${token.accent}15`,
        borderColor: `${token.accent}30`,
      }));
    }
    const rows = (slide.comparisonRows ?? []).slice(0, LIMITS.maxComparisonRows);
    rows.forEach((row, i) => {
      const s = slot(`comparisonRow-${i}`);
      if (s) {
        elements.push(el(slide.id, s, `${row.topic}\t${row.current}\t${row.future}`, {
          type: 'comparison-row',
          fontSize: FONT.comparisonCell,
          color: token.colors.body,
          fontWeight: WEIGHT.body,
          borderColor: `${token.accent}20`,
        }));
      }
    });
  }

  // --- Roadmap phases ---
  if (kind === 'roadmap') {
    const phases = (slide.roadmapPhases ?? []).slice(0, LIMITS.maxRoadmapPhases);
    phases.forEach((phase, i) => {
      const s = slot(`roadmapPhase-${i}`);
      if (s) {
        const bullets = phase.bullets.slice(0, LIMITS.maxBulletsPerSection);
        const content = `Phase ${phase.phase}: ${phase.title}\n${bullets.map(b => `• ${b}`).join('\n')}`;
        elements.push(el(slide.id, s, content, {
          type: 'roadmap-step',
          fontSize: FONT.roadmapBullet,
          color: token.colors.body,
          fontWeight: WEIGHT.body,
          variant: `phase-${i}`,
          background: `${token.accent}12`,
          borderColor: token.accent,
        }));
      }
    });
  }

  // --- Takeaways ---
  const takeaways = (slide.takeaways ?? []).slice(0, LIMITS.maxTakeaways);
  takeaways.forEach((tw, i) => {
    const s = slot(`takeaway-${i}`);
    if (s) {
      elements.push(el(slide.id, s, `✓ ${tw}`, {
        fontSize: FONT.body,
        color: token.colors.body,
        fontWeight: '500',
      }));
    }
  });

  // --- Action items (chip) ---
  const actions = (slide.actionItems ?? []).slice(0, LIMITS.maxActionItems);
  actions.forEach((item, i) => {
    const s = slot(`actionItem-${i}`);
    if (s) {
      elements.push(el(slide.id, s, item, {
        type: 'chip',
        fontSize: FONT.chip,
        color: token.colors.headline,
        fontWeight: '600',
        background: `${token.accent}20`,
        borderColor: `${token.accent}50`,
      }));
    }
  });

  // --- Source note ---
  if (slide.sourceNote) {
    const s = slot('sourceNote');
    if (s) {
      elements.push(el(slide.id, s, slide.sourceNote, {
        fontSize: FONT.sourceNote,
        color: token.colors.sourceNote,
        fontWeight: WEIGHT.sourceNote,
      }));
    }
  }

  return elements;
}

/**
 * Compile all slides in a deck. Replaces AI-generated elements with
 * deterministic layout-compiled elements.
 */
export function compileAllSlides(
  slides: SlideData[],
  token: DesignToken = DEFAULT_TOKEN,
): SlideData[] {
  return slides.map(slide => ({
    ...slide,
    elements: compileSlideElements(slide, token),
  }));
}

// --- Helper ---

interface ElOptions {
  type?: ElementType;
  fontSize: number;
  color: string;
  fontWeight: string;
  textAlign?: ElementData['textAlign'];
  variant?: string;
  background?: string;
  borderColor?: string;
  icon?: string;
}

function el(
  slideId: string,
  slot: { x: number; y: number; width?: number },
  content: string,
  opts: ElOptions,
): ElementData {
  const result: ElementData = {
    id: nextId(slideId),
    type: opts.type ?? 'text',
    content,
    x: slot.x,
    y: slot.y,
    width: slot.width,
    fontSize: opts.fontSize,
    color: opts.color,
    fontWeight: opts.fontWeight,
    textAlign: opts.textAlign,
  };
  if (opts.variant) result.variant = opts.variant;
  if (opts.background) result.background = opts.background;
  if (opts.borderColor) result.borderColor = opts.borderColor;
  if (opts.icon) result.icon = opts.icon;
  return result;
}
