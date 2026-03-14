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

export interface ExistingFollowUpResolution {
  followUpId: string;
  parentFieldId: InterviewFieldId;
  label: string;
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

const THEME_TOPIC_FOLLOWUPS: Record<ThemeCategory, FollowUpStep> = {
  workstyle_remote: {
    id: 'fu-remote-theme-focus',
    parentFieldId: 'theme',
    question: 'リモートワークの何を主題にしたいですか？',
    reason: '同じリモートワークでも、生産性・制度・コストで構成が大きく変わるためです',
    options: [
      { id: 'remote-theme-productivity', label: '生産性や成果の出し方を主題にしたい', promptHint: '生産性指標・会議運営・評価設計を重視' },
      { id: 'remote-theme-policy', label: '制度設計やルール整備を主題にしたい', promptHint: '制度設計・出社ルール・定着施策を重視' },
      { id: 'remote-theme-cost', label: 'コスト最適化と働き方の両立を主題にしたい', promptHint: '固定費最適化・働き方の両立を重視' },
      { id: 'remote-theme-management', label: 'マネジメントやチーム運営を主題にしたい', promptHint: 'マネジメント改善・コミュニケーション運用を重視' },
    ],
    fallbackPrompt: '今回のテーマで最も重視する論点を入力してください',
  },
  ai_dx: {
    id: 'fu-ai-theme-focus',
    parentFieldId: 'theme',
    question: 'AI導入のどこに焦点を当てたいですか？',
    reason: 'AIテーマは、工数削減・売上成長・全社展開など論点が分かれるためです',
    options: [
      { id: 'ai-theme-cost', label: '工数削減や業務効率化に焦点を当てたい', promptHint: '工数削減・自動化・ROI を重視' },
      { id: 'ai-theme-growth', label: '売上成長や競争優位に焦点を当てたい', promptHint: '成長機会・競争優位・収益インパクトを重視' },
      { id: 'ai-theme-quality', label: '品質向上やスピード改善に焦点を当てたい', promptHint: '品質・処理速度・顧客体験改善を重視' },
      { id: 'ai-theme-rollout', label: '導入ロードマップや全社展開に焦点を当てたい', promptHint: '導入計画・展開順序・定着を重視' },
    ],
    fallbackPrompt: 'AI導入テーマの焦点を入力してください',
  },
  sales_marketing: {
    id: 'fu-sales-theme-focus',
    parentFieldId: 'theme',
    question: '営業・提案のどこを強く打ち出したいですか？',
    reason: '提案資料は、差別化・受注・稟議通過で構成が変わるためです',
    options: [
      { id: 'sales-theme-winrate', label: '受注率や商談前進率を上げたい', promptHint: '受注率・次回商談化を重視' },
      { id: 'sales-theme-diff', label: '競合との差別化を明確にしたい', promptHint: '比較優位・独自価値を重視' },
      { id: 'sales-theme-budget', label: '予算承認や稟議通過を狙いたい', promptHint: '費用対効果・稟議材料を重視' },
      { id: 'sales-theme-proof', label: '導入後の効果や事例を見せたい', promptHint: '事例・成果実証を重視' },
    ],
    fallbackPrompt: '営業テーマで最も重視する狙いを入力してください',
  },
  hr_recruitment: {
    id: 'fu-hr-theme-focus',
    parentFieldId: 'theme',
    question: '採用テーマのどこを主題にしたいですか？',
    reason: '採用ブランディングは、候補者訴求・EVP・定着で構成が変わるためです',
    options: [
      { id: 'hr-theme-evp', label: '候補者に刺さる EVP を主題にしたい', promptHint: 'EVP・魅力訴求を重視' },
      { id: 'hr-theme-brand', label: '採用ブランドの見せ方を主題にしたい', promptHint: 'ブランドメッセージ・差別化を重視' },
      { id: 'hr-theme-funnel', label: '応募や選考移行率の改善を主題にしたい', promptHint: '応募率・選考移行率改善を重視' },
      { id: 'hr-theme-retention', label: '入社後の定着や活躍を主題にしたい', promptHint: '定着・オンボーディングを重視' },
    ],
    fallbackPrompt: '採用テーマで最も重視する観点を入力してください',
  },
  training: {
    id: 'fu-training-theme-focus',
    parentFieldId: 'theme',
    question: '研修テーマのどこを掘り下げたいですか？',
    reason: '研修は、知識習得・行動変容・現場定着で構成が変わるためです',
    options: [
      { id: 'training-theme-skill', label: '実務スキルの習得を主題にしたい', promptHint: '具体スキル・演習を重視' },
      { id: 'training-theme-action', label: '受講後の行動変容を主題にしたい', promptHint: '行動変容・現場適用を重視' },
      { id: 'training-theme-manager', label: '管理職や現場フォローを主題にしたい', promptHint: '管理職巻き込み・定着を重視' },
      { id: 'training-theme-standard', label: '標準手順の定着を主題にしたい', promptHint: '標準化・運用統一を重視' },
    ],
    fallbackPrompt: '研修テーマで最も重視する観点を入力してください',
  },
  compliance_risk: {
    id: 'fu-risk-theme-focus',
    parentFieldId: 'theme',
    question: 'リスクテーマのどこを主題にしたいですか？',
    reason: '予防・対応・規制対応では、伝えるべき内容が大きく変わるためです',
    options: [
      { id: 'risk-theme-prevent', label: '予防や未然防止を主題にしたい', promptHint: '予防策・行動基準を重視' },
      { id: 'risk-theme-response', label: 'インシデント対応を主題にしたい', promptHint: '対応フロー・初動を重視' },
      { id: 'risk-theme-regulation', label: '法令や規制対応を主題にしたい', promptHint: '規制対応・期限管理を重視' },
      { id: 'risk-theme-governance', label: '経営レベルのガバナンスを主題にしたい', promptHint: 'ガバナンス・責任体制を重視' },
    ],
    fallbackPrompt: 'リスクテーマで最も重視する観点を入力してください',
  },
  general: {
    id: 'fu-gen-theme-focus',
    parentFieldId: 'theme',
    question: 'そのテーマで、特に何をはっきりさせたいですか？',
    reason: 'テーマが広いと構成がぼやけるため、まず論点の軸を決めます',
    options: [
      { id: 'gen-theme-efficiency', label: 'コスト削減や効率化をはっきりさせたい', promptHint: '費用対効果・改善効果を重視' },
      { id: 'gen-theme-growth', label: '売上拡大や成長機会をはっきりさせたい', promptHint: '成長余地・機会訴求を重視' },
      { id: 'gen-theme-risk', label: 'リスク低減や安全性向上をはっきりさせたい', promptHint: 'リスク比較・予防策を重視' },
      { id: 'gen-theme-choice', label: 'どの選択肢を採るべきかをはっきりさせたい', promptHint: '比較・意思決定支援を重視' },
    ],
    fallbackPrompt: 'そのテーマで最も重視する論点を入力してください',
  },
};

const GENERAL_AUDIENCE_CONTEXT_FOLLOWUP: FollowUpStep = {
  id: 'fu-gen-audience-context',
  parentFieldId: 'targetAudience',
  question: 'その読者は、どんな場面でこの資料を使いますか？',
  reason: '役割だけでは広いため、利用シーンまで絞ると訴求が鋭くなります',
  options: [
    { id: 'gen-audience-budget', label: '予算判断・方針決定の場で使う', promptHint: '意思決定支援・投資判断を重視' },
    { id: 'gen-audience-approval', label: '社内稟議・導入検討の場で使う', promptHint: '比較材料・導入理由を重視' },
    { id: 'gen-audience-ops', label: '現場運用・教育展開の場で使う', promptHint: '実務手順・定着施策を重視' },
    { id: 'gen-audience-proposal', label: '社外提案・顧客説明の場で使う', promptHint: '提案価値・説得材料を重視' },
  ],
  fallbackPrompt: 'その読者が資料を使う場面を入力してください',
};

const GENERAL_MESSAGE_OUTCOME_FOLLOWUP: FollowUpStep = {
  id: 'fu-gen-message-outcome',
  parentFieldId: 'keyMessage',
  question: 'その資料で、最終的に何をはっきり伝えたいですか？',
  reason: '「判断してほしい」だけでは広いため、結論の中身まで絞り込みます',
  options: [
    { id: 'gen-outcome-cost', label: 'コスト削減や生産性向上の根拠を示したい', promptHint: '費用対効果・改善効果を示す構成' },
    { id: 'gen-outcome-growth', label: '売上拡大や成長機会を示したい', promptHint: '成長余地・収益インパクトを示す構成' },
    { id: 'gen-outcome-risk', label: 'リスク低減や安全性向上を示したい', promptHint: 'リスク比較・予防策を示す構成' },
    { id: 'gen-outcome-choice', label: 'どの選択肢を採るべきかを示したい', promptHint: '比較・意思決定支援を重視した構成' },
  ],
  fallbackPrompt: '最終的に伝えたい結論の中身を入力してください',
};

const KEY_MESSAGE_ACTION_REFINEMENTS: Partial<Record<ThemeCategory, FollowUpStep>> = {
  ai_dx: {
    id: 'fu-ai-message-action',
    parentFieldId: 'keyMessage',
    question: 'その成果指標を踏まえて、相手に何を決めてほしいですか？',
    reason: '成果指標だけでは結論になり切らないため、次の判断や行動まで確定します',
    options: [
      { id: 'ai-action-priority', label: '優先業務から AI 導入を始めるべき', promptHint: '導入優先順位・スモールスタートを重視' },
      { id: 'ai-action-budget', label: '予算承認を取り、PoC を進めるべき', promptHint: '予算判断・PoC 開始を重視' },
      { id: 'ai-action-scale', label: '成果の出た施策を全社展開すべき', promptHint: '横展開・ロードマップを重視' },
      { id: 'ai-action-rebuild', label: '現場業務を AI 前提で再設計すべき', promptHint: '業務再設計・定着を重視' },
    ],
    fallbackPrompt: '相手に決めてほしい次の行動を入力してください',
  },
  hr_recruitment: {
    id: 'fu-hr-message-action',
    parentFieldId: 'keyMessage',
    question: 'その強みを踏まえて、採用活動をどう変えるべきですか？',
    reason: '魅力の列挙だけでは弱いため、採用上の打ち手まで具体化します',
    options: [
      { id: 'hr-action-evp', label: '候補者に刺さる EVP を前面に出すべき', promptHint: '訴求軸の再整理を重視' },
      { id: 'hr-action-funnel', label: '応募から選考移行までの訴求を見直すべき', promptHint: '応募率・選考移行率改善を重視' },
      { id: 'hr-action-brand', label: '採用ブランドの見せ方を統一すべき', promptHint: 'ブランドメッセージ統一を重視' },
      { id: 'hr-action-proof', label: '社員の声や実績で信頼性を補強すべき', promptHint: '事例・証拠で裏付ける構成' },
    ],
    fallbackPrompt: '採用活動としてどう変えたいか入力してください',
  },
  training: {
    id: 'fu-training-message-action',
    parentFieldId: 'keyMessage',
    question: 'その研修で、現場にどんな変化を起こしたいですか？',
    reason: '習得テーマだけでは弱いため、受講後の現場行動まで詰めます',
    options: [
      { id: 'training-action-immediate', label: '受講後すぐ使う行動に落とし込むべき', promptHint: '即実践できる構成を重視' },
      { id: 'training-action-standard', label: '守るべき標準手順を定着させるべき', promptHint: '標準化・運用定着を重視' },
      { id: 'training-action-exercise', label: '講義より演習中心に切り替えるべき', promptHint: '演習・ワークショップ型を重視' },
      { id: 'training-action-follow', label: '管理職フォローまで含めて設計すべき', promptHint: '現場フォロー・定着施策を重視' },
    ],
    fallbackPrompt: '研修後に起こしたい現場変化を入力してください',
  },
  compliance_risk: {
    id: 'fu-risk-message-action',
    parentFieldId: 'keyMessage',
    question: 'そのリスクを踏まえて、次に何を徹底すべきですか？',
    reason: 'リスクの種類だけでは弱いため、求める対応まで確定します',
    options: [
      { id: 'risk-action-priority', label: '優先度の高い対策から着手すべき', promptHint: '優先順位・対策計画を重視' },
      { id: 'risk-action-rules', label: '現場が守る行動基準を明文化すべき', promptHint: '行動基準・チェックリストを重視' },
      { id: 'risk-action-escalation', label: '報告・エスカレーション手順を徹底すべき', promptHint: '対応フロー・責任分担を重視' },
      { id: 'risk-action-deadline', label: '期限付きで規制対応計画を決めるべき', promptHint: '期限管理・法令対応を重視' },
    ],
    fallbackPrompt: '次に徹底すべき対応を入力してください',
  },
};

function getFieldFollowUpAnswers(
  existingFollowUpAnswers: ExistingFollowUpResolution[],
  fieldId: InterviewFieldId
): ExistingFollowUpResolution[] {
  return existingFollowUpAnswers.filter(answer => answer.parentFieldId === fieldId && answer.label.trim().length > 0);
}

function hasFollowUpId(
  existingFollowUpAnswers: ExistingFollowUpResolution[],
  followUpId: string
): boolean {
  return existingFollowUpAnswers.some(answer => answer.followUpId === followUpId);
}

function getRefinementFollowUp(
  fieldId: InterviewFieldId,
  category: ThemeCategory,
  existingFollowUpAnswers: ExistingFollowUpResolution[]
): FollowUpStep | null {
  if (fieldId === 'targetAudience') {
    if (category === 'general' && !hasFollowUpId(existingFollowUpAnswers, GENERAL_AUDIENCE_CONTEXT_FOLLOWUP.id)) {
      return GENERAL_AUDIENCE_CONTEXT_FOLLOWUP;
    }
    return null;
  }

  if (fieldId !== 'keyMessage') {
    return null;
  }

  if (category === 'general') {
    if (!hasFollowUpId(existingFollowUpAnswers, GENERAL_MESSAGE_OUTCOME_FOLLOWUP.id)) {
      return GENERAL_MESSAGE_OUTCOME_FOLLOWUP;
    }
    return null;
  }

  const refinement = KEY_MESSAGE_ACTION_REFINEMENTS[category];
  if (!refinement || hasFollowUpId(existingFollowUpAnswers, refinement.id)) {
    return null;
  }

  return refinement;
}

/**
 * Get follow-up questions for a field based on theme category and quality flags.
 * Returns null if no follow-up is needed.
 */
export function getFollowUpForField(
  fieldId: InterviewFieldId,
  theme: string,
  currentValue: string,
  hasFlagSeverity: QualitySeverity | null,
  existingFollowUpAnswers: ExistingFollowUpResolution[] = []
): FollowUpStep | null {
  // Only generate follow-ups for flagged fields
  if (!hasFlagSeverity) return null;
  // Only for fields that have templates
  if (fieldId !== 'theme' && fieldId !== 'targetAudience' && fieldId !== 'keyMessage') return null;

  const category = classifyTheme(theme);
  if (fieldId === 'theme') {
    return THEME_TOPIC_FOLLOWUPS[category] ?? THEME_TOPIC_FOLLOWUPS.general;
  }
  const fieldFollowUps = getFieldFollowUpAnswers(existingFollowUpAnswers, fieldId);
  if (fieldFollowUps.length > 0) {
    return getRefinementFollowUp(fieldId, category, fieldFollowUps);
  }

  const template = THEME_FOLLOWUPS[category]?.[fieldId];
  if (!template) return null;

  return template;
}

/**
 * Get all applicable follow-up steps based on current answers and quality assessment.
 */
export function getAllFollowUps(
  theme: string,
  fieldFlags: Record<InterviewFieldId, QualitySeverity | null>,
  existingFollowUpAnswers: ExistingFollowUpResolution[] = []
): FollowUpStep[] {
  const steps: FollowUpStep[] = [];
  const fieldsToCheck: InterviewFieldId[] = ['theme', 'targetAudience', 'keyMessage'];

  for (const fieldId of fieldsToCheck) {
    const severity = fieldFlags[fieldId];
    if (severity) {
      const followUp = getFollowUpForField(fieldId, theme, '', severity, existingFollowUpAnswers);
      if (followUp) steps.push(followUp);
    }
  }

  return steps;
}
