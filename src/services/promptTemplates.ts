/**
 * Prompt templates and quality constraints for slide generation.
 * M4: Safer prompt design with anti-patterns and page-specific rules.
 */

export type PageKind =
  | 'cover'
  | 'executive-summary'
  | 'problem-analysis'
  | 'comparison'
  | 'roadmap'
  | 'deep-dive'
  | 'decision-cta';

/**
 * Quality rules that apply to all slides.
 */
export const QUALITY_RULES = {
  /** Maximum characters per fact bullet */
  MAX_FACT_LENGTH: 60,
  /** Maximum facts per slide */
  MAX_FACTS: 3,
  /** Maximum KPIs per slide */
  MAX_KPIS: 2,
  /** Maximum sections per slide */
  MAX_SECTIONS: 2,
  /** Maximum bullets per section */
  MAX_SECTION_BULLETS: 3,
  /** Fixed comparison rows */
  COMPARISON_ROWS: 3,
  /** Fixed roadmap phases */
  ROADMAP_PHASES: 3,
  /** Maximum action items */
  MAX_ACTION_ITEMS: 3,
  /** Maximum takeaways */
  MAX_TAKEAWAYS: 3,
};

/**
 * Anti-patterns to avoid in generated content.
 */
export const ANTI_PATTERNS = {
  /** Generic headline patterns that lack specificity */
  genericHeadlines: [
    'について',
    '概要',
    'まとめ',
    '紹介',
    '説明',
    '概説',
    '総括',
    'まとめると',
  ],
  /** Words that indicate vague or unsubstantiated claims */
  vagueQuantifiers: [
    '多くの',
    '様々な',
    'いくつかの',
    '多数の',
    '若干の',
  ],
  /** Patterns that suggest fabricated precision */
  suspiciousPrecision: [
    /\d+\.\d+%/,  // Overly precise percentages like 47.3%
    /\d+\.\d+億/, // Overly precise large numbers
  ],
};

/**
 * Page-specific content requirements.
 */
export const PAGE_REQUIREMENTS: Record<PageKind, {
  eyebrow: boolean;
  headline: boolean;
  subheadline: boolean;
  facts: boolean;
  kpis: boolean;
  specialFields: string[];
}> = {
  cover: {
    eyebrow: true,
    headline: true,
    subheadline: true,
    facts: false,
    kpis: true,
    specialFields: [],
  },
  'executive-summary': {
    eyebrow: true,
    headline: true,
    subheadline: false,
    facts: true,
    kpis: true,
    specialFields: [],
  },
  'problem-analysis': {
    eyebrow: true,
    headline: true,
    subheadline: false,
    facts: true,
    kpis: true,
    specialFields: ['sections'],
  },
  comparison: {
    eyebrow: true,
    headline: true,
    subheadline: false,
    facts: false,
    kpis: false,
    specialFields: ['comparisonRows'],
  },
  roadmap: {
    eyebrow: true,
    headline: true,
    subheadline: false,
    facts: false,
    kpis: false,
    specialFields: ['roadmapPhases'],
  },
  'deep-dive': {
    eyebrow: true,
    headline: true,
    subheadline: false,
    facts: true,
    kpis: true,
    specialFields: ['sections'],
  },
  'decision-cta': {
    eyebrow: true,
    headline: true,
    subheadline: false,
    facts: false,
    kpis: false,
    specialFields: ['actionItems', 'takeaways'],
  },
};

/**
 * Slide structure by count.
 */
export const SLIDE_STRUCTURES: Record<number, PageKind[]> = {
  3: ['cover', 'problem-analysis', 'decision-cta'],
  5: ['cover', 'executive-summary', 'problem-analysis', 'comparison', 'decision-cta'],
  8: ['cover', 'executive-summary', 'problem-analysis', 'deep-dive', 'deep-dive', 'comparison', 'roadmap', 'decision-cta'],
  10: ['cover', 'executive-summary', 'problem-analysis', 'deep-dive', 'deep-dive', 'deep-dive', 'deep-dive', 'comparison', 'roadmap', 'decision-cta'],
};

/**
 * Build structure guide string for the prompt.
 */
export function buildStructureGuide(slideCount: number): string {
  const structure = SLIDE_STRUCTURES[slideCount];
  if (!structure) {
    return `${slideCount}枚: 適切な構成を構築`;
  }

  const counts: Record<string, number> = {};
  const labels: string[] = [];

  for (const kind of structure) {
    counts[kind] = (counts[kind] || 0) + 1;
  }

  let kindIndex: Record<string, number> = {};
  for (const kind of structure) {
    const count = counts[kind];
    if (count > 1) {
      kindIndex[kind] = (kindIndex[kind] || 0) + 1;
      labels.push(`${kind} (${kindIndex[kind]}/${count})`);
    } else {
      labels.push(kind);
    }
  }

  return `${slideCount}枚: ${labels.join(' → ')}`;
}

/**
 * Build quality constraints block for the prompt.
 */
export function buildQualityConstraints(): string {
  return `
### 品質制約
- 各スライドの主張は**1つ**に絞る
- headline には汎用語（「〜について」「概要」「まとめ」等）を使わない
- KPIは最大${QUALITY_RULES.MAX_KPIS}件（数値+単位を明確に分離）
- factsは最大${QUALITY_RULES.MAX_FACTS}件（各${QUALITY_RULES.MAX_FACT_LENGTH}文字以内）
- eyebrowは必ず「NN / セクション名」形式
- 全テキストは日本語
- bgPromptは必ず英語にする
`;
}

/**
 * Build evidence usage rules for the prompt.
 */
export function buildEvidenceRules(): string {
  return `
### 数値利用ルール
- KPI / fact / comparison の数値は、提供されたエビデンスからのみ引用する
- evidenceRefs フィールドに使用した claim の id を記載する
- エビデンスにない数値を捏造しない
- 数値の精度を勝手に変えない（例: 50%を47.3%にしない）
- エビデンスが不足する場合は定性的表現（「増加傾向」「大幅に改善」等）を使う
`;
}

/**
 * Build anti-pattern warnings for the prompt.
 */
export function buildAntiPatternWarnings(): string {
  return `
### 禁止事項
- 汎用的なheadline（「〜について」「概要」「まとめ」等）は使わない
- 曖昧な数量詞（「多くの」「様々な」等）のみで説明しない
- 出典のない数値を精密に見せかけない（47.3%等）
- sourceNote に存在しない出典を書かない
`;
}

/**
 * Build page requirements table for the prompt.
 */
export function buildPageRequirementsTable(): string {
  return `
### ページ種別ごとの必須要素
| ページ種別 | eyebrow | headline | sub | facts | kpis | 特殊要素 |
|-----------|---------|----------|-----|-------|------|---------|
| cover（表紙） | ○ | ○ | ○ | - | 1個 | - |
| executive-summary | ○ | ○ | - | 1-2 | 1-2 | - |
| problem-analysis | ○ | ○ | - | 1 | 1-2 | sections（2つ、各3弾丸まで） |
| comparison | ○ | ○ | - | - | - | comparisonRows（3行固定） |
| roadmap | ○ | ○ | - | - | - | roadmapPhases（3つ固定） |
| deep-dive | ○ | ○ | - | 1 | 1-2 | sections（2つ、各3弾丸まで） |
| decision-cta | ○ | ○ | - | - | - | actionItems（3つ）+ takeaways（2-3） |
`;
}
