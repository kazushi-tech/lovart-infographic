/**
 * Post-processing safety layer for compiled slide elements.
 * Clamps coordinates, enforces minimum font sizes, and prevents overflow.
 */

import type { SlideData, ElementData } from '../demoData';
import { LIMITS } from './layoutRules';

const MIN_FONT_SIZE = 11;
const MAX_FONT_SIZE = 64;
const MIN_COORD = 0;
const MAX_X = 94;
const MAX_Y = 95;
const MIN_WIDTH = 10;
const MAX_WIDTH = 92;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Sanitize a single element: clamp coordinates, enforce font limits,
 * prevent width overflow.
 */
function sanitizeElement(el: ElementData): ElementData {
  const x = clamp(el.x, MIN_COORD, MAX_X);
  const y = clamp(el.y, MIN_COORD, MAX_Y);
  const fontSize = clamp(el.fontSize || 16, MIN_FONT_SIZE, MAX_FONT_SIZE);

  let width = el.width;
  if (width !== undefined) {
    width = clamp(width, MIN_WIDTH, MAX_WIDTH);
    // Prevent right-edge overflow
    if (x + width > 98) {
      width = 98 - x;
    }
  }

  return { ...el, x, y, fontSize, width };
}

/**
 * Enforce content limits on semantic fields before they reach the compiler.
 * Truncates arrays that exceed configured maximums.
 */
function enforceContentLimits(slide: SlideData): SlideData {
  return {
    ...slide,
    kpis: slide.kpis?.slice(0, LIMITS.maxKpis),
    facts: slide.facts?.slice(0, LIMITS.maxFacts),
    sections: slide.sections?.slice(0, LIMITS.maxSections).map(sec => ({
      ...sec,
      bullets: sec.bullets.slice(0, LIMITS.maxBulletsPerSection),
    })),
    comparisonRows: slide.comparisonRows?.slice(0, LIMITS.maxComparisonRows),
    roadmapPhases: slide.roadmapPhases?.slice(0, LIMITS.maxRoadmapPhases).map(phase => ({
      ...phase,
      bullets: phase.bullets.slice(0, LIMITS.maxBulletsPerSection),
    })),
    actionItems: slide.actionItems?.slice(0, LIMITS.maxActionItems),
    takeaways: slide.takeaways?.slice(0, LIMITS.maxTakeaways),
  };
}

/**
 * Full sanitization pipeline for a single slide.
 */
export function sanitizeSlide(slide: SlideData): SlideData {
  const limited = enforceContentLimits(slide);
  return {
    ...limited,
    elements: limited.elements.map(sanitizeElement),
  };
}

/**
 * Sanitize all slides in a deck.
 */
export function sanitizeAllSlides(slides: SlideData[]): SlideData[] {
  return slides.map(sanitizeSlide);
}
