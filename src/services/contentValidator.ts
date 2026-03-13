/**
 * Content Validator Service (M5)
 * Validates slide content quality, detects anti-patterns, and generates warnings.
 */

import type { SlideData, SourceRef } from '../demoData';
import { ANTI_PATTERNS, QUALITY_RULES } from './promptTemplates';

export interface ValidationWarning {
  slideId: string;
  slideIndex: number;
  type: 'headline' | 'evidence' | 'freshness' | 'duplicate' | 'format' | 'source';
  message: string;
  severity: 'critical' | 'major' | 'minor';
  suggestion?: string;
}

export interface ValidationResult {
  isValid: boolean;
  warnings: ValidationWarning[];
  hasCritical: boolean;
  hasMajor: boolean;
}

/**
 * Check if a headline contains generic/vague patterns.
 */
function hasGenericHeadline(headline: string): boolean {
  if (!headline) return true;
  const lowerHeadline = headline.toLowerCase();
  return ANTI_PATTERNS.genericHeadlines.some(pattern =>
    lowerHeadline.includes(pattern.toLowerCase())
  );
}

/**
 * Check if a number shows suspicious precision (likely fabricated).
 */
function hasSuspiciousPrecision(text: string): boolean {
  return ANTI_PATTERNS.suspiciousPrecision.some(pattern => pattern.test(text));
}

/**
 * Check if text contains vague quantifiers without specific data.
 */
function hasVagueQuantifiers(text: string): boolean {
  const lowerText = text.toLowerCase();
  return ANTI_PATTERNS.vagueQuantifiers.some(quantifier =>
    lowerText.includes(quantifier.toLowerCase())
  );
}

/**
 * Check source freshness based on publishedAt date.
 */
function getSourceFreshnessWarning(source: SourceRef, freshnessThresholdMonths = 24): { isStale: boolean; message: string } | null {
  if (!source.publishedAt) {
    return {
      isStale: true,
      message: `出典「${source.title}」の公開日が不明です`
    };
  }

  const publishedDate = new Date(source.publishedAt);
  const now = new Date();
  const monthsDiff = (now.getFullYear() - publishedDate.getFullYear()) * 12 +
                     (now.getMonth() - publishedDate.getMonth());

  if (monthsDiff > freshnessThresholdMonths) {
    return {
      isStale: true,
      message: `出典「${source.publisher || source.title}」のデータが${Math.floor(monthsDiff / 12)}年前のものです`
    };
  }

  return null;
}

/**
 * Validate a single slide for quality issues.
 */
export function validateSlide(slide: SlideData, slideIndex: number): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];

  // Headline validation
  if (!slide.headline) {
    warnings.push({
      slideId: slide.id,
      slideIndex,
      type: 'headline',
      message: 'headline が設定されていません',
      severity: 'critical',
      suggestion: '各スライドには明確なheadlineを設定してください'
    });
  } else if (hasGenericHeadline(slide.headline)) {
    warnings.push({
      slideId: slide.id,
      slideIndex,
      type: 'headline',
      message: `headline「${slide.headline}」が汎用的すぎます`,
      severity: 'major',
      suggestion: '具体的な主張を含むheadlineに変更してください'
    });
  }

  // Eyebrow format validation
  if (slide.eyebrow && !/^\d{2}\s*\/\s*/.test(slide.eyebrow)) {
    warnings.push({
      slideId: slide.id,
      slideIndex,
      type: 'format',
      message: `eyebrow「${slide.eyebrow}」が「NN / セクション名」形式ではありません`,
      severity: 'minor',
      suggestion: 'eyebrowは「01 / 概要」のような形式にしてください'
    });
  }

  // Facts validation
  if (slide.facts) {
    slide.facts.forEach((fact, idx) => {
      if (fact.length > QUALITY_RULES.MAX_FACT_LENGTH) {
        warnings.push({
          slideId: slide.id,
          slideIndex,
          type: 'format',
          message: `fact[${idx}] が${fact.length}文字です（上限${QUALITY_RULES.MAX_FACT_LENGTH}文字）`,
          severity: 'minor',
          suggestion: 'factを短く要約してください'
        });
      }
      if (hasSuspiciousPrecision(fact)) {
        warnings.push({
          slideId: slide.id,
          slideIndex,
          type: 'evidence',
          message: `fact[${idx}] に不自然な精度の数値が含まれています: ${fact}`,
          severity: 'major',
          suggestion: '元データの精度を維持するか、定性的表現に変更してください'
        });
      }
    });
  }

  // KPI validation
  if (slide.kpis && slide.kpis.length > QUALITY_RULES.MAX_KPIS) {
    warnings.push({
      slideId: slide.id,
      slideIndex,
      type: 'format',
      message: `KPI が${slide.kpis.length}件あります（上限${QUALITY_RULES.MAX_KPIS}件）`,
      severity: 'minor',
      suggestion: '最も重要なKPIに絞ってください'
    });
  }

  // Evidence reference validation for numeric content
  const hasNumericContent =
    (slide.kpis && slide.kpis.length > 0) ||
    (slide.facts && slide.facts.some(f => /\d/.test(f))) ||
    (slide.comparisonRows && slide.comparisonRows.length > 0);

  if (hasNumericContent && (!slide.evidenceRefs || slide.evidenceRefs.length === 0)) {
    warnings.push({
      slideId: slide.id,
      slideIndex,
      type: 'evidence',
      message: '数値を含むスライドに evidenceRefs が設定されていません',
      severity: 'major',
      suggestion: '使用したデータの根拠を evidenceRefs に追加してください'
    });
  }

  // Source freshness validation
  if (slide.sources && slide.sources.length > 0) {
    slide.sources.forEach(source => {
      const freshnessWarning = getSourceFreshnessWarning(source);
      if (freshnessWarning) {
        warnings.push({
          slideId: slide.id,
          slideIndex,
          type: 'freshness',
          message: freshnessWarning.message,
          severity: freshnessWarning.isStale ? 'major' : 'minor',
          suggestion: '最新のデータソースを確認してください'
        });
      }
    });
  }

  // Source note validation for data-heavy slides
  if (hasNumericContent && !slide.sourceNote) {
    warnings.push({
      slideId: slide.id,
      slideIndex,
      type: 'source',
      message: '数値を含むスライドに sourceNote がありません',
      severity: 'minor',
      suggestion: 'データの出典を sourceNote に追加してください'
    });
  }

  return warnings;
}

/**
 * Validate all slides for quality issues and duplicates.
 */
export function validateAllSlides(slides: SlideData[]): ValidationResult {
  const warnings: ValidationWarning[] = [];
  const headlineSet = new Set<string>();
  const numberSet = new Set<string>();

  slides.forEach((slide, index) => {
    // Individual slide validation
    warnings.push(...validateSlide(slide, index));

    // Duplicate headline detection
    if (slide.headline) {
      const normalizedHeadline = slide.headline.toLowerCase().trim();
      if (headlineSet.has(normalizedHeadline)) {
        warnings.push({
          slideId: slide.id,
          slideIndex: index,
          type: 'duplicate',
          message: `headline「${slide.headline}」が他のスライドと重複しています`,
          severity: 'major',
          suggestion: '各スライドに異なるheadlineを設定してください'
        });
      }
      headlineSet.add(normalizedHeadline);
    }

    // Duplicate number detection in KPIs
    if (slide.kpis) {
      slide.kpis.forEach(kpi => {
        const numKey = `${kpi.value}${kpi.unit}`;
        if (numberSet.has(numKey)) {
          warnings.push({
            slideId: slide.id,
            slideIndex: index,
            type: 'duplicate',
            message: `KPI「${kpi.value}${kpi.unit}」が他のスライドでも使用されています`,
            severity: 'minor',
            suggestion: '同じ数値を使い回すのではなく、異なる角度からデータを提示してください'
          });
        }
        numberSet.add(numKey);
      });
    }
  });

  const hasCritical = warnings.some(w => w.severity === 'critical');
  const hasMajor = warnings.some(w => w.severity === 'major');

  return {
    isValid: !hasCritical && !hasMajor,
    warnings,
    hasCritical,
    hasMajor,
  };
}

/**
 * Get a summary of validation issues for display.
 */
export function getValidationSummary(result: ValidationResult): string {
  if (result.warnings.length === 0) {
    return '✓ 品質チェック: 問題なし';
  }

  const critical = result.warnings.filter(w => w.severity === 'critical').length;
  const major = result.warnings.filter(w => w.severity === 'major').length;
  const minor = result.warnings.filter(w => w.severity === 'minor').length;

  const parts: string[] = [];
  if (critical > 0) parts.push(`🔴 Critical: ${critical}`);
  if (major > 0) parts.push(`🟠 Major: ${major}`);
  if (minor > 0) parts.push(`🟡 Minor: ${minor}`);

  return `品質チェック: ${parts.join(', ')}`;
}

/**
 * Group warnings by slide for easier display.
 */
export function groupWarningsBySlide(
  warnings: ValidationWarning[]
): Map<string, ValidationWarning[]> {
  const grouped = new Map<string, ValidationWarning[]>();
  warnings.forEach(warning => {
    const existing = grouped.get(warning.slideId) || [];
    existing.push(warning);
    grouped.set(warning.slideId, existing);
  });
  return grouped;
}
