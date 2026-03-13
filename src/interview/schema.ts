// Interview wizard types and step definitions

export type AppScreen = 'wizard' | 'review' | 'generating' | 'editor';

export type InterviewFieldId =
  | 'theme'
  | 'styleId'
  | 'slideCount'
  | 'targetAudience'
  | 'keyMessage'
  | 'tone'
  | 'supplementary';

export interface AnswerEntry {
  fieldId: InterviewFieldId;
  value: string;
  label: string;
  source: 'choice' | 'text' | 'sample';
}

export interface BriefDraft {
  theme: string;
  styleId?: string;
  styleLabel?: string;
  slideCount?: string;
  targetAudience?: string;
  keyMessage?: string;
  tone?: string;
  supplementary?: string;
  // Evidence preferences (M0)
  evidenceMode?: 'auto' | 'manual' | 'none';
  sourcePreference?: 'recent-only' | 'allow-older' | 'any';
}

export interface StepOption {
  id: string;
  label: string;
  desc?: string;
  imageUrl?: string;
  mode?: 'preset' | 'custom'; // 'custom' enables free-text input (e.g. "その他")
}

export type StepInputType = 'text' | 'single-choice' | 'grid-choice';

export interface InterviewStep {
  fieldId: InterviewFieldId;
  question: string;
  inputType: StepInputType;
  options?: StepOption[];
  placeholder?: string;
  required: boolean;
}

export const INTERVIEW_STEPS: InterviewStep[] = [
  {
    fieldId: 'theme',
    question: 'インフォグラフィックのテーマ（タイトル）を入力してください。',
    inputType: 'text',
    placeholder: '例: AIが拓く事業成長と競争優位の未来',
    required: true,
  },
  {
    fieldId: 'styleId',
    question: 'デザインのテンプレートを選んでください。',
    inputType: 'grid-choice',
    options: [
      { id: 'corporate', label: 'Corporate（コーポレート）', desc: '白背景、ネイビー×グレー、清潔感', imageUrl: 'https://picsum.photos/seed/corporate/300/200' },
      { id: 'professional', label: 'Professional（プロフェッショナル）', desc: 'ライトグレー背景、ブルー系アクセント', imageUrl: 'https://picsum.photos/seed/professional/300/200' },
      { id: 'executive', label: 'Executive（エグゼクティブ）', desc: 'ダークネイビー背景、ゴールドアクセント、重厚感', imageUrl: 'https://picsum.photos/seed/executive/300/200' },
      { id: 'modern', label: 'Modern（モダン）', desc: 'グラデーション背景、ビビッドカラー', imageUrl: 'https://picsum.photos/seed/modern/300/200' },
      { id: 'minimal', label: 'Minimal（ミニマル）', desc: '真っ白背景、黒テキスト、余白重視', imageUrl: 'https://picsum.photos/seed/minimal/300/200' },
    ],
    required: true,
  },
  {
    fieldId: 'slideCount',
    question: 'スライドの枚数を選んでください。',
    inputType: 'single-choice',
    options: [
      { id: '3', label: '3枚（簡潔版）' },
      { id: '5', label: '5枚（標準）' },
      { id: '8', label: '8枚（詳細版）' },
      { id: '10', label: '10枚（フル版）' },
    ],
    required: true,
  },
  {
    fieldId: 'targetAudience',
    question: 'この資料のターゲット読者（誰に伝えたいか）を教えてください。',
    inputType: 'single-choice',
    options: [
      { id: 'executives', label: '経営層・役員' },
      { id: 'managers', label: '部門長・マネージャー' },
      { id: 'staff', label: '一般社員・スタッフ' },
      { id: 'clients', label: '社外クライアント' },
      { id: 'other', label: 'その他', desc: '自由に入力する', mode: 'custom' },
    ],
    required: true,
  },
  {
    fieldId: 'keyMessage',
    question: 'ターゲットに一番伝えたい「キーメッセージ」は何ですか？',
    inputType: 'single-choice',
    options: [
      { id: 'cost', label: 'コスト削減と効率化' },
      { id: 'growth', label: '売上拡大と事業成長' },
      { id: 'innovation', label: '新規事業とイノベーション' },
      { id: 'risk', label: 'リスク管理とコンプライアンス' },
      { id: 'other', label: 'その他', desc: '自由に入力する', mode: 'custom' },
    ],
    required: true,
  },
  {
    fieldId: 'tone',
    question: '資料全体のトーン＆マナー（雰囲気）を選んでください。',
    inputType: 'single-choice',
    options: [
      { id: 'professional', label: 'プロフェッショナル・論理的' },
      { id: 'passionate', label: '情熱的・ビジョナリー' },
      { id: 'friendly', label: '親しみやすい・カジュアル' },
      { id: 'urgent', label: '危機感・緊急性' },
      { id: 'other', label: 'その他', desc: '自由に入力する', mode: 'custom' },
    ],
    required: true,
  },
  {
    fieldId: 'supplementary',
    question: '最後に、補足事項や強調したいポイントがあれば教えてください。',
    inputType: 'single-choice',
    options: [
      { id: 'data', label: '具体的な数値データを強調したい' },
      { id: 'roadmap', label: '今後のロードマップを明確にしたい' },
      { id: 'comparison', label: '他社との比較を分かりやすくしたい' },
      { id: 'none', label: '特になし' },
      { id: 'other', label: 'その他', desc: '自由に入力する', mode: 'custom' },
    ],
    required: false,
  },
];

export const SAMPLE_ANSWERS: Record<InterviewFieldId, AnswerEntry> = {
  theme: {
    fieldId: 'theme',
    value: 'AIが拓く事業成長と競争優位の未来',
    label: 'AIが拓く事業成長と競争優位の未来',
    source: 'sample',
  },
  styleId: {
    fieldId: 'styleId',
    value: 'professional',
    label: 'Professional（プロフェッショナル）',
    source: 'sample',
  },
  slideCount: {
    fieldId: 'slideCount',
    value: '5',
    label: '5枚（標準）',
    source: 'sample',
  },
  targetAudience: {
    fieldId: 'targetAudience',
    value: '経営層・事業責任者',
    label: '経営層・事業責任者',
    source: 'sample',
  },
  keyMessage: {
    fieldId: 'keyMessage',
    value: 'AI導入はコスト削減ではなく、新たな価値創造と競争優位性確立のための必須投資である',
    label: 'AI導入はコスト削減ではなく、新たな価値創造と競争優位性確立のための必須投資である',
    source: 'sample',
  },
  tone: {
    fieldId: 'tone',
    value: 'professional',
    label: 'プロフェッショナル・論理的',
    source: 'sample',
  },
  supplementary: {
    fieldId: 'supplementary',
    value: '具体的な数値データやロードマップを含める',
    label: '具体的な数値データやロードマップを含める',
    source: 'sample',
  },
};
