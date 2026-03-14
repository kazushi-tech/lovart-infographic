import type { AdaptiveBriefContext, AdaptiveFieldId, AdaptiveOptionsResult, AdaptiveQuestionPacket, StepOption, InterviewFieldId, AnswerEntry } from '../interview/schema';
import { classifyTheme, getFollowUpForField, type FollowUpStep } from '../interview/followUpTemplates';
import type { QualitySeverity } from '../interview/answerQuality';

/**
 * Cache for adaptive options results.
 * Key: normalized hash of context + fieldId
 */
const adaptiveCache = new Map<string, AdaptiveOptionsResult>();
const MAX_CACHE_SIZE = 30;

/**
 * Generate a cache key from context and fieldId.
 */
function getCacheKey(context: AdaptiveBriefContext, fieldId: AdaptiveFieldId): string {
  const { theme, styleId, slideCount } = context;
  return `adaptive:${fieldId}:${theme}:${styleId || ''}:${slideCount || ''}`;
}

/**
 * Clean oldest cache entries when exceeding limit.
 */
function cleanCacheIfNeeded(): void {
  if (adaptiveCache.size > MAX_CACHE_SIZE) {
    const firstKey = adaptiveCache.keys().next().value;
    if (firstKey) adaptiveCache.delete(firstKey);
  }
}

/**
 * Generate adaptive options for a field based on theme context.
 * Currently provides simple theme-aware suggestions that can be enhanced.
 */
async function generateAdaptiveOptions(
  fieldId: AdaptiveFieldId,
  context: AdaptiveBriefContext
): Promise<StepOption[]> {
  const { theme } = context;

  switch (fieldId) {
    case 'targetAudience':
      return generateTargetAudienceOptions(theme);
    case 'keyMessage':
      return generateKeyMessageOptions(theme);
    case 'tone':
      return generateToneOptions(theme);
    case 'supplementary':
      return generateSupplementaryOptions(theme);
    default:
      return [];
  }
}

/**
 * Simple rule-based options (can be replaced with AI generation).
 */
function generateTargetAudienceOptions(theme: string): StepOption[] {
  // Check for common business themes and suggest related audiences
  const lowerTheme = theme.toLowerCase();

  const baseOptions: StepOption[] = [
    { id: 'executives', label: '経営層・役員' },
    { id: 'managers', label: '部門長・マネージャー' },
    { id: 'staff', label: '一般社員・スタッフ' },
    { id: 'clients', label: '社外クライアント' },
    { id: 'other', label: 'その他', desc: '自由に入力する', mode: 'custom' },
  ];

  // Simple heuristic: if theme contains "customer" or "service", prioritize clients
  if (lowerTheme.includes('customer') || lowerTheme.includes('service')) {
    return [
      { id: 'clients', label: '顧客・エンドユーザー' },
      ...baseOptions.filter(o => o.id !== 'clients'),
    ];
  }

  return baseOptions;
}

function generateKeyMessageOptions(theme: string): StepOption[] {
  const lowerTheme = theme.toLowerCase();

  const baseOptions: StepOption[] = [
    { id: 'cost', label: 'コスト削減と効率化' },
    { id: 'growth', label: '売上拡大と事業成長' },
    { id: 'innovation', label: '新規事業とイノベーション' },
    { id: 'risk', label: 'リスク管理とコンプライアンス' },
    { id: 'other', label: 'その他', desc: '自由に入力する', mode: 'custom' },
  ];

  // Simple heuristics based on theme keywords
  if (lowerTheme.includes('growth') || lowerTheme.includes('scale')) {
    return [
      { id: 'growth', label: '急速な事業拡大と規模拡大' },
      ...baseOptions.filter(o => o.id !== 'growth'),
    ];
  }

  if (lowerTheme.includes('ai') || lowerTheme.includes('technology')) {
    return [
      { id: 'innovation', label: '技術革新と競争優位の確立' },
      ...baseOptions.filter(o => o.id !== 'innovation'),
    ];
  }

  return baseOptions;
}

function generateToneOptions(theme: string): StepOption[] {
  const lowerTheme = theme.toLowerCase();

  const baseOptions: StepOption[] = [
    { id: 'professional', label: 'プロフェッショナル・論理的' },
    { id: 'passionate', label: '情熱的・ビジョナリー' },
    { id: 'friendly', label: '親しみやすい・カジュアル' },
    { id: 'urgent', label: '危機感・緊急性' },
    { id: 'other', label: 'その他', desc: '自由に入力する', mode: 'custom' },
  ];

  // Tone suggestions based on theme (simple heuristic)
  if (lowerTheme.includes('crisis') || lowerTheme.includes('risk')) {
    return [
      { id: 'urgent', label: '緊急性・リスク管理の重視' },
      ...baseOptions.filter(o => o.id !== 'urgent'),
    ];
  }

  return baseOptions;
}

function generateSupplementaryOptions(theme: string): StepOption[] {
  const lowerTheme = theme.toLowerCase();

  const baseOptions: StepOption[] = [
    { id: 'data', label: '具体的な数値データを強調したい' },
    { id: 'roadmap', label: '今後のロードマップを明確にしたい' },
    { id: 'comparison', label: '他社との比較を分かりやすくしたい' },
    { id: 'none', label: '特になし' },
    { id: 'other', label: 'その他', desc: '自由に入力する', mode: 'custom' },
  ];

  // If theme mentions data or metrics, prioritize data
  if (lowerTheme.includes('data') || lowerTheme.includes('metric') || lowerTheme.includes('kpi')) {
    return [
      { id: 'data', label: 'データとKPIの視覚的強調' },
      ...baseOptions.filter(o => o.id !== 'data'),
    ];
  }

  return baseOptions;
}

/**
 * Fetch adaptive options for a field, using cache when available.
 */
export async function fetchAdaptiveOptions(
  fieldId: AdaptiveFieldId,
  context: AdaptiveBriefContext
): Promise<AdaptiveOptionsResult> {
  const cacheKey = getCacheKey(context, fieldId);
  const cached = adaptiveCache.get(cacheKey);

  // Return cached result if within 5 minutes
  if (cached && Date.now() - cached.generatedAt < 5 * 60 * 1000) {
    return { ...cached, isCached: true };
  }

  // Generate new options
  const options = await generateAdaptiveOptions(fieldId, context);
  const result: AdaptiveOptionsResult = {
    fieldId,
    options,
    isCached: false,
    generatedAt: Date.now(),
  };

  // Cache and clean if needed
  cleanCacheIfNeeded();
  adaptiveCache.set(cacheKey, result);

  return result;
}

/**
 * Prefetch adaptive options for all adaptive fields in parallel.
 */
export async function prefetchAllAdaptiveOptions(
  context: AdaptiveBriefContext
): Promise<Record<AdaptiveFieldId, AdaptiveOptionsResult | null>> {
  const fields: AdaptiveFieldId[] = ['targetAudience', 'keyMessage', 'tone', 'supplementary'];

  const results = await Promise.allSettled(
    fields.map(field => fetchAdaptiveOptions(field, context))
  );

  return fields.reduce((acc, field, index) => {
    const result = results[index];
    acc[field] = result.status === 'fulfilled' ? result.value : null;
    return acc;
  }, {} as Record<AdaptiveFieldId, AdaptiveOptionsResult | null>);
}

/**
 * Clear all adaptive options cache.
 */
export function clearAdaptiveCache(): void {
  adaptiveCache.clear();
}

/**
 * Convert a FollowUpStep to an AdaptiveQuestionPacket for UI consumption.
 */
function toQuestionPacket(followUp: FollowUpStep): AdaptiveQuestionPacket {
  return {
    id: followUp.id,
    parentFieldId: followUp.parentFieldId,
    question: followUp.question,
    reason: followUp.reason,
    options: followUp.options.map(o => ({
      id: o.id,
      label: o.label,
      promptHint: o.promptHint,
    })),
    fallbackPrompt: followUp.fallbackPrompt,
  };
}

/**
 * Generate follow-up question packets based on theme and quality flags.
 * Returns packets for fields that have quality issues and need clarification.
 */
export function generateFollowUpQuestions(
  theme: string,
  fieldFlags: Record<string, QualitySeverity | null>
): AdaptiveQuestionPacket[] {
  const packets: AdaptiveQuestionPacket[] = [];
  const fieldsToCheck: InterviewFieldId[] = ['targetAudience', 'keyMessage'];

  for (const fieldId of fieldsToCheck) {
    const severity = fieldFlags[fieldId] ?? null;
    if (severity) {
      const followUp = getFollowUpForField(fieldId, theme, '', severity);
      if (followUp) {
        packets.push(toQuestionPacket(followUp));
      }
    }
  }

  return packets;
}
