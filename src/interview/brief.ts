// Brief compilation utilities

import type { BriefDraft, AnswerEntry } from './schema';
import type { ResearchPacket } from '../demoData';

export interface BriefSummaryItem {
  label: string;
  value: string;
}

export function getBriefSummaryItems(brief: BriefDraft): BriefSummaryItem[] {
  const items: BriefSummaryItem[] = [];
  if (brief.theme) items.push({ label: 'テーマ', value: brief.theme });
  if (brief.styleLabel) items.push({ label: 'スタイル', value: brief.styleLabel });
  if (brief.slideCount) items.push({ label: 'スライド枚数', value: `${brief.slideCount}枚` });
  if (brief.targetAudience) items.push({ label: 'ターゲット', value: brief.targetAudience });
  if (brief.keyMessage) items.push({ label: 'キーメッセージ', value: brief.keyMessage });
  if (brief.tone) items.push({ label: 'トーン＆マナー', value: brief.tone });
  if (brief.supplementary) items.push({ label: '補足事項', value: brief.supplementary });
  return items;
}

// M4: Rich Brief types for evidence-aware prompt generation

export interface RichBriefContext {
  /** Normalized theme */
  theme: string;
  /** Target audience description */
  targetAudience: string;
  /** Key message to convey */
  keyMessage: string;
  /** Style identifier */
  styleId: string;
  /** Tone description */
  tone: string;
  /** Supplementary notes */
  supplementary: string;
  /** Slide count */
  slideCount: number;
  /** Research packet with evidence (optional) */
  researchSummary?: string;
  /** Available evidence claims (optional) */
  evidenceCount?: number;
  /** Source count (optional) */
  sourceCount?: number;
  /** Warnings from research (optional) */
  researchWarnings?: string[];
}

/**
 * Build a rich brief context from answers and optional research packet.
 * This provides a comprehensive context for prompt generation.
 */
export function buildRichBrief(
  answers: Record<string, AnswerEntry>,
  researchPacket?: ResearchPacket
): RichBriefContext {
  const theme = answers.theme?.label || answers.theme?.value || '';
  const targetAudience = answers.targetAudience?.label || answers.targetAudience?.value || '';
  const keyMessage = answers.keyMessage?.label || answers.keyMessage?.value || '';
  const styleId = answers.styleId?.value || 'professional';
  const tone = answers.tone?.label || answers.tone?.value || '';
  const supplementary = answers.supplementary?.label || answers.supplementary?.value || '';
  const slideCount = parseInt(answers.slideCount?.value || '5', 10);

  const context: RichBriefContext = {
    theme,
    targetAudience,
    keyMessage,
    styleId,
    tone,
    supplementary,
    slideCount,
  };

  // Enrich with research data if available
  if (researchPacket) {
    context.researchSummary = researchPacket.summary;
    context.evidenceCount = researchPacket.claims.length;
    context.sourceCount = researchPacket.sources.length;
    context.researchWarnings = researchPacket.warnings.length > 0 ? researchPacket.warnings : undefined;
  }

  return context;
}

/**
 * Generate a narrative brief string for prompt injection.
 */
export function formatRichBriefNarrative(brief: RichBriefContext): string {
  let narrative = `
## プロジェクト概要
- **テーマ**: ${brief.theme}
- **ターゲット読者**: ${brief.targetAudience}
- **キーメッセージ**: ${brief.keyMessage}
- **トーン**: ${brief.tone}
- **スライド枚数**: ${brief.slideCount}枚
- **デザインスタイル**: ${brief.styleId}
`;

  if (brief.supplementary && brief.supplementary !== '特になし') {
    narrative += `- **補足事項**: ${brief.supplementary}\n`;
  }

  if (brief.researchSummary) {
    narrative += `
## リサーチ要約
${brief.researchSummary}
（出典: ${brief.sourceCount}件、エビデンス: ${brief.evidenceCount}件）
`;
  }

  if (brief.researchWarnings && brief.researchWarnings.length > 0) {
    narrative += `
## 注意事項
${brief.researchWarnings.map(w => `- ${w}`).join('\n')}
`;
  }

  return narrative;
}
