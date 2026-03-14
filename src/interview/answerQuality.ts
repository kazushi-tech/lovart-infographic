// Answer quality assessment rules per interview field

import type { InterviewFieldId, AnswerEntry } from './schema';

export type QualitySeverity = 'critical' | 'warning' | 'ok';

export interface QualityFlag {
  fieldId: InterviewFieldId;
  severity: QualitySeverity;
  message: string;
  suggestion?: string;
}

export interface BriefQualityResult {
  flags: QualityFlag[];
  hasCritical: boolean;
  hasWarning: boolean;
  score: number; // 0-100
}

export interface QualityFollowUpResolution {
  parentFieldId: InterviewFieldId;
  label: string;
  promptHint?: string;
}

// --- Field-level quality rules ---

const VAGUE_THEME_PATTERNS = [
  /^.{1,6}$/, // too short (6 chars or less)
  /^(業務改善|DX推進|AI活用|効率化|生産性向上|改革)$/,
  /(について|とは|に関する|の概要|の紹介)$/u,
];

const VAGUE_AUDIENCE_PATTERNS = [
  /^(経営層|社員|関係者|皆さん|みんな|全員)$/,
  /^(経営層・役員)$/,
  /^(部門長・マネージャー|部門長|マネージャー)$/,
  /^(一般社員・スタッフ|スタッフ)$/,
];

const WEAK_MESSAGE_PATTERNS = [
  /^.{1,10}$/, // too short
  /^(AIは重要|DXが必要|効率化したい|改善が必要|成長したい)$/,
];

function assessTheme(value: string): QualityFlag | null {
  if (!value.trim()) {
    return { fieldId: 'theme', severity: 'critical', message: 'テーマが未入力です', suggestion: '具体的なテーマを入力してください' };
  }
  for (const pat of VAGUE_THEME_PATTERNS) {
    if (pat.test(value.trim())) {
      return {
        fieldId: 'theme',
        severity: 'warning',
        message: 'テーマが抽象的です',
        suggestion: '対象領域・目的・対象者を含めると具体性が上がります（例: 「営業部門におけるAI導入で受注率30%向上」）',
      };
    }
  }
  return null;
}

function getFollowUpResolution(
  followUpAnswers: QualityFollowUpResolution[],
  fieldId: InterviewFieldId
): QualityFollowUpResolution | null {
  const resolutions = followUpAnswers.filter(
    answer => answer.parentFieldId === fieldId && answer.label.trim().length > 0
  );
  return resolutions.length > 0 ? resolutions[resolutions.length - 1] : null;
}

function isGenericAudienceResolution(resolution: QualityFollowUpResolution | null): boolean {
  if (!resolution) return true;
  return /^(意思決定者|推進者|実務担当者)/.test(resolution.label);
}

function isGenericMessageResolution(resolution: QualityFollowUpResolution | null): boolean {
  if (!resolution) return true;
  return /^(理解してほしい|判断・決定してほしい|行動を起こしてほしい)/.test(resolution.label);
}

function assessTargetAudience(value: string, resolution: QualityFollowUpResolution | null): QualityFlag | null {
  if (!value.trim()) {
    return { fieldId: 'targetAudience', severity: 'critical', message: 'ターゲットが未入力です' };
  }
  for (const pat of VAGUE_AUDIENCE_PATTERNS) {
    if (pat.test(value.trim())) {
      if (resolution && !isGenericAudienceResolution(resolution)) {
        return null;
      }
      return {
        fieldId: 'targetAudience',
        severity: 'warning',
        message: resolution ? 'ターゲットがまだ広めです' : 'ターゲットが広すぎます',
        suggestion: resolution
          ? '部署・責任範囲・意思決定の文脈まで含めると、さらに訴求が鋭くなります'
          : '「どの部門の」「どの意思決定段階の」など、絞り込みがあると訴求力が上がります',
      };
    }
  }
  return null;
}

function assessKeyMessage(value: string, resolution: QualityFollowUpResolution | null): QualityFlag | null {
  if (!value.trim()) {
    return { fieldId: 'keyMessage', severity: 'critical', message: 'キーメッセージが未入力です' };
  }
  for (const pat of WEAK_MESSAGE_PATTERNS) {
    if (pat.test(value.trim())) {
      if (resolution && !isGenericMessageResolution(resolution)) {
        return null;
      }
      return {
        fieldId: 'keyMessage',
        severity: 'critical',
        message: resolution ? 'キーメッセージがまだ抽象的です' : 'キーメッセージが曖昧です',
        suggestion: resolution
          ? '結論がそのまま見出しになる粒度まで具体化してください'
          : '「何を」「なぜ」「どうしてほしいか」を含めてください（例: 「AI導入により営業工数を50%削減し、戦略的業務にシフトすべき」）',
      };
    }
  }
  // Check if message lacks actionable intent
  const hasAction = /[すべきる要必|ために|によって|することで|実現|達成|向上|推進]/.test(value);
  if (!hasAction && value.length < 20) {
    if (resolution && !isGenericMessageResolution(resolution)) {
      return null;
    }
    return {
      fieldId: 'keyMessage',
      severity: 'warning',
      message: 'キーメッセージに行動喚起が弱い可能性があります',
      suggestion: '相手に「何を理解・判断・実行してほしいか」を明確にすると効果的です',
    };
  }
  return null;
}

function assessSupplementary(value: string, theme: string): QualityFlag | null {
  if (!value.trim() || value === '特になし' || value === '（スキップ）') {
    // Check if theme suggests data/comparison would be valuable
    const needsData = /数値|KPI|ROI|売上|コスト|効率|成果|実績/.test(theme);
    const needsRoadmap = /計画|戦略|推進|導入|移行|フェーズ/.test(theme);
    if (needsData || needsRoadmap) {
      return {
        fieldId: 'supplementary',
        severity: 'warning',
        message: 'テーマに対して補足情報があると効果的です',
        suggestion: needsData
          ? '数値データや比較情報があるとスライドの説得力が上がります'
          : 'ロードマップや段階的計画があると説得力が上がります',
      };
    }
  }
  return null;
}

/**
 * Assess quality of all answers and return flags.
 */
export function assessAnswerQuality(
  answers: Partial<Record<InterviewFieldId, AnswerEntry>>,
  followUpAnswers: QualityFollowUpResolution[] = []
): BriefQualityResult {
  const flags: QualityFlag[] = [];

  // Theme check
  const themeVal = answers.theme?.label || answers.theme?.value || '';
  const themeFlag = assessTheme(themeVal);
  if (themeFlag) flags.push(themeFlag);

  // Target audience check
  const audienceVal = answers.targetAudience?.label || answers.targetAudience?.value || '';
  const audienceFlag = assessTargetAudience(
    audienceVal,
    getFollowUpResolution(followUpAnswers, 'targetAudience')
  );
  if (audienceFlag) flags.push(audienceFlag);

  // Key message check
  const msgVal = answers.keyMessage?.label || answers.keyMessage?.value || '';
  const msgFlag = assessKeyMessage(
    msgVal,
    getFollowUpResolution(followUpAnswers, 'keyMessage')
  );
  if (msgFlag) flags.push(msgFlag);

  // Supplementary check
  const suppVal = answers.supplementary?.label || answers.supplementary?.value || '';
  const suppFlag = assessSupplementary(suppVal, themeVal);
  if (suppFlag) flags.push(suppFlag);

  const hasCritical = flags.some(f => f.severity === 'critical');
  const hasWarning = flags.some(f => f.severity === 'warning');

  // Simple score: start at 100, deduct per issue
  const criticalCount = flags.filter(f => f.severity === 'critical').length;
  const warningCount = flags.filter(f => f.severity === 'warning').length;
  const score = Math.max(0, 100 - criticalCount * 30 - warningCount * 10);

  return { flags, hasCritical, hasWarning, score };
}

/**
 * Get quality flags for a specific field.
 */
export function getFieldQualityFlags(
  result: BriefQualityResult,
  fieldId: InterviewFieldId
): QualityFlag[] {
  return result.flags.filter(f => f.fieldId === fieldId);
}
