import type { AdaptiveBriefContext, AdaptiveFieldId, AdaptiveOptionsResult, AdaptiveQuestionPacket, StepOption, InterviewFieldId, AnswerEntry } from '../interview/schema';
import { classifyTheme, getFollowUpForField, type ExistingFollowUpResolution, type FollowUpStep } from '../interview/followUpTemplates';
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
 * Append a consistent custom option to theme-aware suggestions.
 */
function withOther(options: StepOption[]): StepOption[] {
  return [
    ...options,
    { id: 'other', label: 'その他', desc: '自由に入力する', mode: 'custom' },
  ];
}

function generateTargetAudienceOptions(theme: string): StepOption[] {
  const category = classifyTheme(theme);

  switch (category) {
    case 'workstyle_remote':
      return withOther([
        { id: 'remote-exec', label: '経営層（全社方針・投資判断）' },
        { id: 'remote-manager', label: '部門長・マネージャー（生産性改善）' },
        { id: 'remote-hr', label: '人事・総務（制度設計・運用整備）' },
        { id: 'remote-staff', label: '現場社員（働きやすさ・実務改善）' },
      ]);
    case 'ai_dx':
      return withOther([
        { id: 'ai-exec', label: '経営層・経営企画' },
        { id: 'ai-it', label: 'IT部門・DX推進室' },
        { id: 'ai-business', label: '事業部門・営業部門' },
        { id: 'ai-ops', label: '業務改革・オペレーション責任者' },
      ]);
    case 'sales_marketing':
      return withOther([
        { id: 'sales-enterprise', label: '大企業クライアントの意思決定者' },
        { id: 'sales-midmarket', label: '中堅企業の部門責任者' },
        { id: 'sales-practitioner', label: '現場導入を担う実務担当者' },
        { id: 'sales-partner', label: '代理店・パートナー候補' },
      ]);
    case 'hr_recruitment':
      return withOther([
        { id: 'hr-newgrad', label: '新卒・第二新卒候補者' },
        { id: 'hr-midcareer', label: '中途・即戦力候補者' },
        { id: 'hr-manager', label: '採用責任者・人事部門' },
        { id: 'hr-exec', label: '経営層・事業責任者' },
      ]);
    case 'training':
      return withOther([
        { id: 'training-beginner', label: '新人・初心者' },
        { id: 'training-mid', label: '実務担当の中級者' },
        { id: 'training-manager', label: '現場リーダー・管理職' },
        { id: 'training-specialist', label: '専門職・上級者' },
      ]);
    case 'compliance_risk':
      return withOther([
        { id: 'risk-board', label: '取締役会・監査役' },
        { id: 'risk-manager', label: '部門責任者・管理職' },
        { id: 'risk-practitioner', label: '現場担当者・全社員' },
        { id: 'risk-admin', label: '法務・総務・内部監査' },
      ]);
    default:
      return withOther([
        { id: 'executives', label: '経営層・役員' },
        { id: 'managers', label: '部門長・マネージャー' },
        { id: 'staff', label: '一般社員・スタッフ' },
        { id: 'clients', label: '社外クライアント' },
      ]);
  }
}

function generateKeyMessageOptions(theme: string): StepOption[] {
  const category = classifyTheme(theme);

  switch (category) {
    case 'workstyle_remote':
      return withOther([
        { id: 'remote-productivity', label: '生産性を落とさず成果を高める運用に見直すべき' },
        { id: 'remote-retention', label: '離職防止とエンゲージメント向上のため制度整備すべき' },
        { id: 'remote-cost', label: 'オフィスコスト最適化と働き方の両立を進めるべき' },
        { id: 'remote-policy', label: '出社と在宅のルールを再設計して運用を安定させるべき' },
      ]);
    case 'ai_dx':
      return withOther([
        { id: 'ai-roi', label: 'AI導入で業務工数を削減し、投資対効果を可視化すべき' },
        { id: 'ai-growth', label: 'AI活用で売上成長と競争優位を加速すべき' },
        { id: 'ai-ops', label: '現場業務の品質とスピードを両立すべき' },
        { id: 'ai-roadmap', label: '小さく始めて全社展開する導入ロードマップを示すべき' },
      ]);
    case 'sales_marketing':
      return withOther([
        { id: 'sales-proof', label: '比較優位と導入効果を示し、次回商談につなげるべき' },
        { id: 'sales-budget', label: '費用対効果を示し、予算承認を取りに行くべき' },
        { id: 'sales-poc', label: 'PoC・トライアル開始に踏み出してもらうべき' },
        { id: 'sales-contract', label: '導入判断を後押しし、契約フェーズへ進めるべき' },
      ]);
    case 'hr_recruitment':
      return withOther([
        { id: 'hr-evp', label: '候補者に刺さる EVP を明確に打ち出すべき' },
        { id: 'hr-growth', label: '成長機会とキャリアパスを強く訴求すべき' },
        { id: 'hr-culture', label: '働き方と企業文化の魅力で差別化すべき' },
        { id: 'hr-proof', label: '実績や社員の声で信頼性を補強すべき' },
      ]);
    case 'training':
      return withOther([
        { id: 'training-action', label: '受講後に現場で行動を変えられる内容にすべき' },
        { id: 'training-skill', label: '実務で使える具体スキルを身につけさせるべき' },
        { id: 'training-awareness', label: '危機意識やマインドセットを変えるべき' },
        { id: 'training-process', label: '標準手順を定着させ、運用を揃えるべき' },
      ]);
    case 'compliance_risk':
      return withOther([
        { id: 'risk-prevent', label: '事故を未然に防ぐ行動基準を浸透させるべき' },
        { id: 'risk-response', label: 'インシデント時の対応フローを明確にすべき' },
        { id: 'risk-deadline', label: '法令・規制対応の期限と優先度を示すべき' },
        { id: 'risk-governance', label: '経営レベルのガバナンス課題として認識させるべき' },
      ]);
    default:
      return withOther([
        { id: 'cost', label: 'コスト削減と効率化' },
        { id: 'growth', label: '売上拡大と事業成長' },
        { id: 'innovation', label: '新規事業とイノベーション' },
        { id: 'risk', label: 'リスク管理とコンプライアンス' },
      ]);
  }
}

function generateToneOptions(theme: string): StepOption[] {
  const category = classifyTheme(theme);

  switch (category) {
    case 'workstyle_remote':
      return withOther([
        { id: 'remote-balanced', label: '冷静・実務的（制度と運用を両立）' },
        { id: 'remote-visionary', label: '前向き・未来志向（働き方改革を推進）' },
        { id: 'remote-data', label: 'データ重視・論理的（比較と数値で説得）' },
      ]);
    case 'compliance_risk':
      return withOther([
        { id: 'urgent', label: '危機感・緊急性' },
        { id: 'professional', label: 'プロフェッショナル・論理的' },
        { id: 'strict', label: '厳格・ルール重視' },
      ]);
    default:
      return withOther([
        { id: 'professional', label: 'プロフェッショナル・論理的' },
        { id: 'passionate', label: '情熱的・ビジョナリー' },
        { id: 'friendly', label: '親しみやすい・カジュアル' },
        { id: 'urgent', label: '危機感・緊急性' },
      ]);
  }
}

function generateSupplementaryOptions(theme: string): StepOption[] {
  const category = classifyTheme(theme);

  switch (category) {
    case 'workstyle_remote':
      return withOther([
        { id: 'remote-comparison', label: '他社のハイブリッド勤務事例を比較したい' },
        { id: 'remote-rules', label: '出社頻度や運用ルールを整理したい' },
        { id: 'remote-metrics', label: '生産性や満足度の指標を入れたい' },
        { id: 'remote-roadmap', label: '制度見直しのロードマップを入れたい' },
        { id: 'none', label: '特になし' },
      ]);
    case 'ai_dx':
      return withOther([
        { id: 'data', label: '導入効果の数値データを強調したい' },
        { id: 'roadmap', label: '導入ステップとロードマップを明確にしたい' },
        { id: 'comparison', label: '導入前後の比較を分かりやすくしたい' },
        { id: 'case-study', label: '他社事例や成功例を入れたい' },
        { id: 'none', label: '特になし' },
      ]);
    default:
      return withOther([
        { id: 'data', label: '具体的な数値データを強調したい' },
        { id: 'roadmap', label: '今後のロードマップを明確にしたい' },
        { id: 'comparison', label: '他社との比較を分かりやすくしたい' },
        { id: 'none', label: '特になし' },
      ]);
  }
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
  fieldFlags: Record<string, QualitySeverity | null>,
  existingFollowUpAnswers: ExistingFollowUpResolution[] = []
): AdaptiveQuestionPacket[] {
  const packets: AdaptiveQuestionPacket[] = [];
  const fieldsToCheck: InterviewFieldId[] = ['theme', 'targetAudience', 'keyMessage'];

  for (const fieldId of fieldsToCheck) {
    const severity = fieldFlags[fieldId] ?? null;
    if (severity) {
      const followUp = getFollowUpForField(fieldId, theme, '', severity, existingFollowUpAnswers);
      if (followUp) {
        packets.push(toQuestionPacket(followUp));
      }
    }
  }

  return packets;
}
