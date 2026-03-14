// Brief compilation utilities

import type { BriefDraft, AnswerEntry, InterviewFieldId } from './schema';
import type { ResearchPacket } from '../demoData';
import type { BriefQualityResult, QualityFlag } from './answerQuality';
import type { FollowUpAnswerEntry } from './state';

export interface BriefSummaryItem {
  label: string;
  value: string;
}

export interface QualityIssueGroup {
  label: string;
  fieldId: InterviewFieldId;
  flags: QualityFlag[];
}

/**
 * Group quality flags by field for review display.
 */
export function getQualityIssueGroups(quality: BriefQualityResult): QualityIssueGroup[] {
  const fieldLabels: Record<string, string> = {
    theme: 'テーマ',
    targetAudience: 'ターゲット',
    keyMessage: 'キーメッセージ',
    supplementary: '補足事項',
  };

  const groupMap = new Map<string, QualityIssueGroup>();

  for (const flag of quality.flags) {
    if (!groupMap.has(flag.fieldId)) {
      groupMap.set(flag.fieldId, {
        label: fieldLabels[flag.fieldId] || flag.fieldId,
        fieldId: flag.fieldId,
        flags: [],
      });
    }
    groupMap.get(flag.fieldId)!.flags.push(flag);
  }

  return Array.from(groupMap.values());
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

// M4: Generation brief — structured "AI understanding" for review gate

export interface GenerationBriefSection {
  label: string;
  content: string;
  type: 'audience' | 'goal' | 'must-include' | 'assumption';
}

/**
 * Build structured "AI understanding" sections for the review gate.
 * This shows the user how their answers will be interpreted for generation.
 */
export function buildGenerationBrief(
  brief: BriefDraft,
  followUpHints: string[],
  followUpAnswers: FollowUpAnswerEntry[] = []
): GenerationBriefSection[] {
  const sections: GenerationBriefSection[] = [];
  const themeResolution = followUpAnswers
    .filter(answer => answer.parentFieldId === 'theme' && answer.label.trim().length > 0)
    .map(answer => answer.label.trim())
    .join(' / ');
  const audienceResolution = followUpAnswers
    .filter(answer => answer.parentFieldId === 'targetAudience' && answer.label.trim().length > 0)
    .map(answer => answer.label.trim())
    .join(' / ');
  const messageResolution = followUpAnswers
    .filter(answer => answer.parentFieldId === 'keyMessage' && answer.label.trim().length > 0)
    .map(answer => answer.label.trim())
    .join(' / ');

  // Who is this for?
  const audienceDetail = followUpHints.find(h => h.includes('視点') || h.includes('重視') || h.includes('訴求'));
  sections.push({
    label: '誰に向けた資料か',
    content: brief.targetAudience
      ? [
          brief.targetAudience,
          audienceResolution ? `→ ${audienceResolution}` : '',
          audienceDetail ? `→ ${audienceDetail}` : '',
        ].filter(Boolean).join('\n')
      : '（未設定）',
    type: 'audience',
  });

  // What should they do/understand?
  const goalHint = followUpHints.find(h => h.includes('型') || h.includes('構成'));
  sections.push({
    label: '相手に理解・判断・実行してほしいこと',
    content: brief.keyMessage
      ? [
          brief.keyMessage,
          messageResolution ? `→ ${messageResolution}` : '',
          goalHint ? `→ ${goalHint}` : '',
        ].filter(Boolean).join('\n')
      : '（未設定）',
    type: 'goal',
  });

  // Must-include items
  const mustInclude: string[] = [];
  if (brief.supplementary && brief.supplementary !== '特になし' && brief.supplementary !== '（スキップ）') {
    mustInclude.push(brief.supplementary);
  }
  if (mustInclude.length > 0) {
    sections.push({
      label: '必ず含めるべき要素',
      content: mustInclude.join('、'),
      type: 'must-include',
    });
  }

  // AI assumptions
  const assumptions: string[] = [];
  if (themeResolution) {
    assumptions.push(`テーマの焦点は「${themeResolution}」として解釈します`);
  }
  if (!brief.supplementary || brief.supplementary === '特になし' || brief.supplementary === '（スキップ）') {
    assumptions.push('補足情報なし — AI が一般的な構成で生成します');
  }
  if (brief.slideCount) {
    const count = parseInt(brief.slideCount, 10);
    if (count <= 3) {
      assumptions.push('3枚構成のため、要点を絞った簡潔な内容になります');
    } else if (count >= 8) {
      assumptions.push(`${count}枚構成のため、詳細な展開を含みます`);
    }
  }
  if (assumptions.length > 0) {
    sections.push({
      label: 'AI が置いている前提',
      content: assumptions.join('\n'),
      type: 'assumption',
    });
  }

  return sections;
}

// Rich Brief types for evidence-aware prompt generation

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
  /** Follow-up prompt hints for generation guidance */
  followUpHints?: string[];
  /** Items to avoid in generation */
  avoidItems?: string[];
}

/**
 * Build a rich brief context from answers, follow-up answers, and optional research packet.
 * This provides a comprehensive context for prompt generation.
 */
export function buildRichBrief(
  answers: Record<string, AnswerEntry>,
  researchPacket?: ResearchPacket,
  followUpAnswers?: Array<{ parentFieldId: string; label: string; promptHint?: string }>
): RichBriefContext {
  const theme = answers.theme?.label || answers.theme?.value || '';
  const targetAudience = answers.targetAudience?.label || answers.targetAudience?.value || '';
  const keyMessage = answers.keyMessage?.label || answers.keyMessage?.value || '';
  const styleId = answers.styleId?.value || 'professional';
  const tone = answers.tone?.label || answers.tone?.value || '';
  const supplementary = answers.supplementary?.label || answers.supplementary?.value || '';
  const slideCount = parseInt(answers.slideCount?.value || '5', 10);

  // Enrich audience/message with follow-up detail
  let confirmedTheme = theme;
  let confirmedAudience = targetAudience;
  let confirmedMessage = keyMessage;
  const avoidItems: string[] = [];

  if (followUpAnswers) {
    const themeDetails = followUpAnswers
      .filter(fu => fu.parentFieldId === 'theme' && fu.label)
      .map(fu => fu.label.trim());
    const audienceDetails = followUpAnswers
      .filter(fu => fu.parentFieldId === 'targetAudience' && fu.label)
      .map(fu => fu.label.trim());
    const messageDetails = followUpAnswers
      .filter(fu => fu.parentFieldId === 'keyMessage' && fu.label)
      .map(fu => fu.label.trim());

    if (themeDetails.length > 0) {
      confirmedTheme = `${theme}（${themeDetails.join(' / ')}）`;
    }
    if (audienceDetails.length > 0) {
      confirmedAudience = `${targetAudience}（${audienceDetails.join(' / ')}）`;
    }
    if (messageDetails.length > 0) {
      confirmedMessage = `${keyMessage}（${messageDetails.join(' / ')}）`;
    }
  }

  const context: RichBriefContext = {
    theme: confirmedTheme,
    targetAudience: confirmedAudience,
    keyMessage: confirmedMessage,
    styleId,
    tone,
    supplementary,
    slideCount,
    followUpHints: followUpAnswers?.map(f => f.promptHint).filter((h): h is string => !!h),
    avoidItems: avoidItems.length > 0 ? avoidItems : undefined,
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

  if (brief.followUpHints && brief.followUpHints.length > 0) {
    narrative += `
## 確認済みの方向性
${brief.followUpHints.map(h => `- ${h}`).join('\n')}
`;
  }

  if (brief.researchWarnings && brief.researchWarnings.length > 0) {
    narrative += `
## 注意事項
${brief.researchWarnings.map(w => `- ${w}`).join('\n')}
`;
  }

  if (brief.avoidItems && brief.avoidItems.length > 0) {
    narrative += `
## 避けるべき内容
${brief.avoidItems.map(a => `- ${a}`).join('\n')}
`;
  }

  return narrative;
}
