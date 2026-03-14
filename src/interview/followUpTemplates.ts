// Theme-aware follow-up question templates (deterministic, rule-based)

import type { InterviewFieldId } from './schema';
import type { QualitySeverity } from './answerQuality';

export interface FollowUpStep {
  id: string;
  parentFieldId: InterviewFieldId;
  question: string;
  reason: string;
  options: FollowUpOption[];
  fallbackPrompt: string;
}

export interface FollowUpOption {
  id: string;
  label: string;
  promptHint?: string;
}

export type ThemeCategory =
  | 'workstyle_remote'
  | 'ai_dx'
  | 'sales_marketing'
  | 'hr_recruitment'
  | 'training'
  | 'compliance_risk'
  | 'general';

/**
 * Classify a theme string into a category for follow-up selection.
 */
export function classifyTheme(theme: string): ThemeCategory {
  const t = theme.toLowerCase();
  if (/リモートワーク|テレワーク|在宅勤務|ハイブリッド勤務|働き方/.test(t)) return 'workstyle_remote';
  if (/ai|dx|デジタル|自動化|機械学習|生成ai/.test(t)) return 'ai_dx';
  if (/営業|セールス|マーケ|販促|提案|アップセル|受注/.test(t)) return 'sales_marketing';
  if (/採用|リクルート|候補者|人材|ブランディング|evp/.test(t)) return 'hr_recruitment';
  if (/研修|トレーニング|教育|オンボーディング|新人/.test(t)) return 'training';
  if (/コンプライアンス|リスク|セキュリティ|法令|監査/.test(t)) return 'compliance_risk';
  return 'general';
}

// --- Follow-up templates per theme category × field ---

const THEME_FOLLOWUPS: Record<ThemeCategory, Partial<Record<InterviewFieldId, FollowUpStep>>> = {
  workstyle_remote: {
    targetAudience: {
      id: 'fu-remote-audience',
      parentFieldId: 'targetAudience',
      question: 'リモートワークのどの立場の人に向けた資料ですか？',
      reason: 'リモートワークは、経営・制度設計・現場運用で論点が大きく変わるためです',
      options: [
        { id: 'remote-exec', label: '経営層（全社方針・投資判断）', promptHint: '経営判断・全社方針・コスト最適化を重視' },
        { id: 'remote-manager', label: '部門長（生産性・マネジメント改善）', promptHint: 'チーム生産性・評価・運用課題を重視' },
        { id: 'remote-hr', label: '人事・総務（制度設計・運用整備）', promptHint: '制度設計・ルール整備・定着施策を重視' },
        { id: 'remote-staff', label: '現場社員（働きやすさ・実務改善）', promptHint: '実務のしやすさ・コミュニケーション改善を重視' },
      ],
      fallbackPrompt: '想定読者の部署や役割を入力してください',
    },
    keyMessage: {
      id: 'fu-remote-message',
      parentFieldId: 'keyMessage',
      question: '今回いちばん強く伝えたい結論はどれですか？',
      reason: 'リモートワークは「コスト」だけでなく、生産性・採用・制度運用など複数の結論に分かれるためです',
      options: [
        { id: 'remote-productivity', label: '生産性を落とさず成果を高める運用に見直すべき', promptHint: '生産性改善・会議運営・評価設計を含めて構成' },
        { id: 'remote-retention', label: '離職防止とエンゲージメント向上のために制度整備すべき', promptHint: '定着率・満足度・エンゲージメント改善を重視' },
        { id: 'remote-cost', label: 'オフィスコスト最適化と働き方の両立を進めるべき', promptHint: 'コスト最適化と働き方の両立を比較で見せる' },
        { id: 'remote-policy', label: '出社と在宅のルールを再設計して運用を安定させるべき', promptHint: '運用ルール・制度設計・社内合意形成を重視' },
      ],
      fallbackPrompt: '伝えたい結論を具体的に入力してください',
    },
  },
  ai_dx: {
    targetAudience: {
      id: 'fu-ai-audience',
      parentFieldId: 'targetAudience',
      question: 'AI導入の意思決定に関わるのはどの部門・役職ですか？',
      reason: 'AI導入テーマでは、決裁者と現場推進者で訴求ポイントが大きく異なるため確認します',
      options: [
        { id: 'cxo', label: 'CxO・経営企画', promptHint: '投資対効果・競争優位の視点で構成' },
        { id: 'it-dept', label: 'IT部門・DX推進室', promptHint: '技術選定・実装ロードマップ重視' },
        { id: 'business', label: '事業部門・営業部', promptHint: '業務課題の解決・現場メリット重視' },
      ],
      fallbackPrompt: '具体的な対象者を入力してください',
    },
    keyMessage: {
      id: 'fu-ai-message',
      parentFieldId: 'keyMessage',
      question: 'AI導入で最も伝えたい成果指標は何ですか？',
      reason: '具体的な成果指標があると、スライドの説得力が大幅に上がります',
      options: [
        { id: 'cost-reduction', label: '工数・コスト削減率', promptHint: '定量的なコスト削減効果を強調' },
        { id: 'revenue-growth', label: '売上・受注率の向上', promptHint: '収益インパクトを数値で示す' },
        { id: 'quality-speed', label: '品質向上・スピードアップ', promptHint: '業務品質と速度の改善を示す' },
        { id: 'competitive', label: '競争優位性の確立', promptHint: '市場での差別化を示す' },
      ],
      fallbackPrompt: '具体的な成果指標を入力してください',
    },
  },
  sales_marketing: {
    targetAudience: {
      id: 'fu-sales-audience',
      parentFieldId: 'targetAudience',
      question: '提案先のクライアントの業種・規模を教えてください',
      reason: '提案資料では相手の文脈に合わせた事例が重要です',
      options: [
        { id: 'enterprise', label: '大企業（従業員1000人以上）', promptHint: '大規模導入事例・ガバナンス重視' },
        { id: 'mid-market', label: '中堅企業（100-1000人）', promptHint: '費用対効果・導入スピード重視' },
        { id: 'smb', label: '中小企業（100人未満）', promptHint: 'シンプルさ・即効性を強調' },
      ],
      fallbackPrompt: '提案先の業種・規模を入力してください',
    },
    keyMessage: {
      id: 'fu-sales-cta',
      parentFieldId: 'keyMessage',
      question: '提案後に相手に取ってほしいアクションは？',
      reason: 'ゴールが明確だとスライドの構成とCTAが引き締まります',
      options: [
        { id: 'trial', label: 'トライアル・PoC開始', promptHint: 'PoC提案型の構成' },
        { id: 'meeting', label: '詳細打ち合わせの設定', promptHint: '次回アポ獲得型の構成' },
        { id: 'budget', label: '予算承認・稟議上程', promptHint: '稟議資料型の構成' },
        { id: 'contract', label: '契約・発注', promptHint: '最終提案型の構成' },
      ],
      fallbackPrompt: '相手に期待するアクションを入力してください',
    },
  },
  hr_recruitment: {
    targetAudience: {
      id: 'fu-hr-audience',
      parentFieldId: 'targetAudience',
      question: 'ターゲットとなる候補者層を教えてください',
      reason: '候補者層で訴求すべき価値（EVP）が変わるため確認します',
      options: [
        { id: 'new-grad', label: '新卒・第二新卒', promptHint: '成長機会・カルチャー重視' },
        { id: 'mid-career', label: '中途・即戦力層', promptHint: '裁量・キャリアパス・報酬重視' },
        { id: 'executive', label: 'エグゼクティブ・専門職', promptHint: 'ミッション・影響力・待遇重視' },
      ],
      fallbackPrompt: '候補者層の詳細を入力してください',
    },
    keyMessage: {
      id: 'fu-hr-evp',
      parentFieldId: 'keyMessage',
      question: '最も伝えたい採用上の強み（EVP）は？',
      reason: '採用ブランディングの核となるメッセージを明確にします',
      options: [
        { id: 'culture', label: '企業文化・働き方', promptHint: 'カルチャーフィットを訴求' },
        { id: 'growth', label: '成長機会・キャリアパス', promptHint: '成長環境を訴求' },
        { id: 'impact', label: '社会的インパクト・ミッション', promptHint: 'パーパス・社会貢献を訴求' },
        { id: 'innovation', label: '技術力・イノベーション', promptHint: '技術的挑戦を訴求' },
      ],
      fallbackPrompt: '採用上の強みを入力してください',
    },
  },
  training: {
    targetAudience: {
      id: 'fu-training-audience',
      parentFieldId: 'targetAudience',
      question: '受講者のスキルレベルはどの段階ですか？',
      reason: 'レベルに応じて説明の深さや事例の選び方が変わります',
      options: [
        { id: 'beginner', label: '初心者・新入社員', promptHint: '基礎から丁寧に、用語解説付き' },
        { id: 'intermediate', label: '中級者・実務経験あり', promptHint: '実践テクニック・応用事例中心' },
        { id: 'advanced', label: '上級者・専門職', promptHint: '最新トレンド・高度な知見中心' },
      ],
      fallbackPrompt: '受講者レベルの詳細を入力してください',
    },
    keyMessage: {
      id: 'fu-training-outcome',
      parentFieldId: 'keyMessage',
      question: '研修後に受講者に期待する行動変容は？',
      reason: '期待する行動が明確だと、研修スライドの構成が引き締まります',
      options: [
        { id: 'awareness', label: '意識改革・マインドセット変化', promptHint: '気づき・動機付け型の構成' },
        { id: 'skill', label: '具体的スキルの習得', promptHint: 'ハウツー・演習型の構成' },
        { id: 'process', label: '業務プロセスの変更', promptHint: 'Before/After・手順書型の構成' },
      ],
      fallbackPrompt: '期待する行動変容を入力してください',
    },
  },
  compliance_risk: {
    targetAudience: {
      id: 'fu-risk-audience',
      parentFieldId: 'targetAudience',
      question: 'この情報を受け取る立場は？',
      reason: '報告先によって求められる情報の粒度が異なります',
      options: [
        { id: 'board', label: '取締役会・監査役', promptHint: '要約重視・リスクマトリクス付き' },
        { id: 'dept-head', label: '部門責任者', promptHint: '実務影響・対応手順重視' },
        { id: 'all-staff', label: '全社員向け', promptHint: '分かりやすさ・行動指針重視' },
      ],
      fallbackPrompt: '報告先の詳細を入力してください',
    },
    keyMessage: {
      id: 'fu-risk-focus',
      parentFieldId: 'keyMessage',
      question: '最も伝えたいリスクの焦点は？',
      reason: 'リスクの種類で構成と緊急度の表現が変わります',
      options: [
        { id: 'prevention', label: '予防・未然防止', promptHint: '予防策・チェックリスト型' },
        { id: 'response', label: 'インシデント対応', promptHint: '対応フロー・エスカレーション型' },
        { id: 'regulation', label: '規制対応・法改正', promptHint: '法令解説・対応期限型' },
      ],
      fallbackPrompt: 'リスクの焦点を入力してください',
    },
  },
  general: {
    targetAudience: {
      id: 'fu-gen-audience',
      parentFieldId: 'targetAudience',
      question: 'もう少し具体的に、読者はどんな立場の方ですか？',
      reason: '読者の解像度が上がると、スライドの訴求力が格段に向上します',
      options: [
        { id: 'decision-maker', label: '意思決定者（予算・方針決定権あり）', promptHint: '投資対効果・意思決定支援型' },
        { id: 'influencer', label: '推進者（社内推薦・調整役）', promptHint: '社内説得・メリット訴求型' },
        { id: 'practitioner', label: '実務担当者（実際に手を動かす人）', promptHint: '具体手順・実践ガイド型' },
      ],
      fallbackPrompt: '読者の立場を具体的に入力してください',
    },
    keyMessage: {
      id: 'fu-gen-message',
      parentFieldId: 'keyMessage',
      question: 'そのメッセージで読者に何をしてほしいですか？',
      reason: '行動喚起が明確だとスライドの結論が引き締まります',
      options: [
        { id: 'understand', label: '理解してほしい（情報提供）', promptHint: '解説・教育型の構成' },
        { id: 'decide', label: '判断・決定してほしい', promptHint: '比較・根拠提示型の構成' },
        { id: 'act', label: '行動を起こしてほしい', promptHint: 'CTA・ロードマップ型の構成' },
      ],
      fallbackPrompt: '読者に期待するアクションを入力してください',
    },
  },
};

/**
 * Get follow-up questions for a field based on theme category and quality flags.
 * Returns null if no follow-up is needed.
 */
export function getFollowUpForField(
  fieldId: InterviewFieldId,
  theme: string,
  currentValue: string,
  hasFlagSeverity: QualitySeverity | null
): FollowUpStep | null {
  // Only generate follow-ups for flagged fields
  if (!hasFlagSeverity) return null;
  // Only for fields that have templates
  if (fieldId !== 'targetAudience' && fieldId !== 'keyMessage') return null;

  const category = classifyTheme(theme);
  const template = THEME_FOLLOWUPS[category]?.[fieldId];
  if (!template) return null;

  return template;
}

/**
 * Get all applicable follow-up steps based on current answers and quality assessment.
 */
export function getAllFollowUps(
  theme: string,
  fieldFlags: Record<InterviewFieldId, QualitySeverity | null>
): FollowUpStep[] {
  const steps: FollowUpStep[] = [];
  const fieldsToCheck: InterviewFieldId[] = ['targetAudience', 'keyMessage'];

  for (const fieldId of fieldsToCheck) {
    const severity = fieldFlags[fieldId];
    if (severity) {
      const followUp = getFollowUpForField(fieldId, theme, '', severity);
      if (followUp) steps.push(followUp);
    }
  }

  return steps;
}
