/**
 * 適応的インタビューのための質問バンク
 * Question Bank for Adaptive Interview
 */

import { BriefQuestion, BriefAnswer } from './briefTypes';

/**
 * コア質問（必須）
 */
export const coreQuestions: BriefQuestion[] = [
  {
    id: 'theme',
    prompt: '何について伝えたいですか？',
    inputMode: 'text',
    required: true,
    category: 'core',
    shouldAsk: () => true,
    summarize: (answer) => String(answer),
  },
  {
    id: 'sourceMaterialType',
    prompt: '素材はどのような形式で提供できますか？',
    inputMode: 'single-choice',
    required: true,
    category: 'source',
    options: [
      { id: 'text-input', label: '直接テキストを入力する' },
      { id: 'url', label: 'WebページのURLを参照する' },
      { id: 'file-upload', label: 'ファイルをアップロードする' },
      { id: 'whitepaper', label: 'ホワイトペーパーがある' },
    ],
    shouldAsk: () => true,
    summarize: (answer) => {
      const labels: Record<string, string> = {
        'text-input': 'テキスト入力',
        'url': 'URL参照',
        'file-upload': 'ファイルアップロード',
        'whitepaper': 'ホワイトペーパー',
      };
      return labels[String(answer)] || String(answer);
    },
  },
  {
    id: 'outputTarget',
    prompt: 'どのような形式で出力しますか？',
    inputMode: 'single-choice',
    required: true,
    category: 'core',
    options: [
      { id: 'lovart-slides', label: 'Lovartスライド（複数スライド）' },
      { id: 'external-infographic-image', label: 'インフォグラフィック画像（単一画像）' },
    ],
    shouldAsk: () => true,
    summarize: (answer) => {
      const labels: Record<string, string> = {
        'lovart-slides': 'Lovartスライド',
        'external-infographic-image': 'インフォグラフィック画像',
      };
      return labels[String(answer)] || String(answer);
    },
  },
];

/**
 * インテント別質問
 */
export const intentQuestions: BriefQuestion[] = [
  {
    id: 'intent',
    prompt: 'この資料の目的は何ですか？',
    inputMode: 'single-choice',
    required: true,
    category: 'intent',
    options: [
      { id: 'executive', label: '経営層向け要約' },
      { id: 'proposal', label: '提案書' },
      { id: 'comparison', label: '比較分析' },
      { id: 'plan', label: '計画・ロードマップ' },
      { id: 'report', label: 'レポート' },
      { id: 'whitepaper-infographic', label: 'ホワイトペーパーからインフォグラフィック' },
    ],
    shouldAsk: () => true,
    summarize: (answer) => {
      const labels: Record<string, string> = {
        executive: '経営層向け要約',
        proposal: '提案書',
        comparison: '比較分析',
        plan: '計画・ロードマップ',
        report: 'レポート',
        'whitepaper-infographic': 'ホワイトペーパー→インフォグラフィック',
      };
      return labels[String(answer)] || String(answer);
    },
  },
];

/**
 * スライド生成用質問（outputTarget === 'lovart-slides'）
 */
export const slideQuestions: BriefQuestion[] = [
  {
    id: 'slideStyle',
    prompt: 'スライドのスタイルはどのようなものがいいですか？',
    inputMode: 'single-choice',
    required: false,
    category: 'style',
    options: [
      { id: 'minimalist', label: 'ミニマリスト（シンプル・清潔）' },
      { id: 'corporate', label: 'コーポレート（プロフェッショナル）' },
      { id: 'creative', label: 'クリエイティブ（独創的）' },
      { id: 'data-driven', label: 'データ重視（グラフ・チャート）' },
      { id: 'storytelling', label: 'ストーリーテリング（ナラティブ）' },
    ],
    shouldAsk: (answers) => {
      return (answers.outputTarget as BriefAnswer | undefined)?.value === 'lovart-slides';
    },
    summarize: (answer) => {
      const labels: Record<string, string> = {
        minimalist: 'ミニマリスト',
        corporate: 'コーポレート',
        creative: 'クリエイティブ',
        'data-driven': 'データ重視',
        storytelling: 'ストーリーテリング',
      };
      return labels[String(answer)] || String(answer);
    },
  },
  {
    id: 'slideCount',
    prompt: 'スライドは何枚程度作成しますか？',
    inputMode: 'single-choice',
    required: false,
    category: 'structure',
    options: [
      { id: '3-5', label: '3-5枚（簡潔）' },
      { id: '6-8', label: '6-8枚（標準）' },
      { id: '9-12', label: '9-12枚（詳細）' },
      { id: '13+', label: '13枚以上（包括的）' },
    ],
    shouldAsk: (answers) => {
      return (answers.outputTarget as BriefAnswer | undefined)?.value === 'lovart-slides';
    },
    summarize: (answer) => `${answer}枚`,
  },
  {
    id: 'tone',
    prompt: 'トーン（口調）はどのような感じがいいですか？',
    inputMode: 'single-choice',
    required: false,
    category: 'style',
    options: [
      { id: 'professional', label: 'プロフェッショナル' },
      { id: 'friendly', label: '親しみやすい' },
      { id: 'urgent', label: '緊急感' },
      { id: 'inspiring', label: 'インスピレーショナル' },
      { id: 'neutral', label: 'ニュートラル' },
    ],
    shouldAsk: (answers) => {
      return (answers.outputTarget as BriefAnswer | undefined)?.value === 'lovart-slides';
    },
    summarize: (answer) => {
      const labels: Record<string, string> = {
        professional: 'プロフェッショナル',
        friendly: '親しみやすい',
        urgent: '緊急感',
        inspiring: 'インスピレーショナル',
        neutral: 'ニュートラル',
      };
      return labels[String(answer)] || String(answer);
    },
  },
  {
    id: 'targetAudience',
    prompt: 'ターゲットオーディエンスは誰ですか？',
    inputMode: 'single-choice',
    required: false,
    category: 'delivery',
    options: [
      { id: 'executive', label: '経営層' },
      { id: 'technical', label: '技術担当者' },
      { id: 'sales', label: '営業・マーケティング' },
      { id: 'general', label: '一般層' },
      { id: 'investor', label: '投資家' },
    ],
    shouldAsk: (answers) => {
      return (answers.outputTarget as BriefAnswer | undefined)?.value === 'lovart-slides';
    },
    summarize: (answer) => {
      const labels: Record<string, string> = {
        executive: '経営層',
        technical: '技術担当者',
        sales: '営業・マーケティング',
        general: '一般層',
        investor: '投資家',
      };
      return labels[String(answer)] || String(answer);
    },
  },
];

/**
 * 外部インフォグラフィック用質問（outputTarget === 'external-infographic-image'）
 */
export const infographicQuestions: BriefQuestion[] = [
  {
    id: 'sourceDocumentState',
    prompt: 'ソース文書はどのような状態ですか？',
    inputMode: 'single-choice',
    required: false,
    category: 'source',
    options: [
      { id: 'finalized', label: '最終版（確定済み）' },
      { id: 'draft', label: 'ドラフト' },
      { id: 'review', label: 'レビュー中' },
    ],
    shouldAsk: (answers) => {
      return (answers.outputTarget as BriefAnswer | undefined)?.value === 'external-infographic-image';
    },
    summarize: (answer) => {
      const labels: Record<string, string> = {
        finalized: '最終版',
        draft: 'ドラフト',
        review: 'レビュー中',
      };
      return labels[String(answer)] || String(answer);
    },
  },
  {
    id: 'essentialClaims',
    prompt: '必ず含めるべきクレーム（主張）はありますか？',
    inputMode: 'text',
    required: false,
    category: 'structure',
    shouldAsk: (answers) => {
      return (answers.outputTarget as BriefAnswer | undefined)?.value === 'external-infographic-image';
    },
    summarize: (answer) => String(answer),
  },
  {
    id: 'visualZones',
    prompt: 'どのくらいのビジュアルゾーンを想定していますか？',
    inputMode: 'single-choice',
    required: false,
    category: 'structure',
    options: [
      { id: '1-2', label: '1-2個（シンプル）' },
      { id: '3-4', label: '3-4個（標準）' },
      { id: '5-7', label: '5-7個（詳細）' },
      { id: '8+', label: '8個以上（複雑）' },
    ],
    shouldAsk: (answers) => {
      return (answers.outputTarget as BriefAnswer | undefined)?.value === 'external-infographic-image';
    },
    summarize: (answer) => `${answer}個のビジュアルゾーン`,
  },
  {
    id: 'showCitations',
    prompt: '引用を視覚的に明示しますか？',
    inputMode: 'single-choice',
    required: false,
    category: 'delivery',
    options: [
      { id: 'true', label: 'はい（引用を表示）' },
      { id: 'false', label: 'いいえ（引用を表示しない）' },
    ],
    shouldAsk: (answers) => {
      return (answers.outputTarget as BriefAnswer | undefined)?.value === 'external-infographic-image';
    },
    summarize: (answer) => answer === 'true' ? '引用を表示' : '引用を表示しない',
  },
  {
    id: 'aspectRatio',
    prompt: 'アスペクト比はどれにしますか？',
    inputMode: 'single-choice',
    required: false,
    category: 'delivery',
    options: [
      { id: '16:9', label: '16:9（ワイド）' },
      { id: '4:3', label: '4:3（標準）' },
      { id: '1:1', label: '1:1（スクエア）' },
      { id: '9:16', label: '9:16（縦長・モバイル）' },
    ],
    shouldAsk: (answers) => {
      return (answers.outputTarget as BriefAnswer | undefined)?.value === 'external-infographic-image';
    },
    summarize: (answer) => `アスペクト比 ${answer}`,
  },
];

/**
 * 全質問の統合
 */
export const allQuestions: BriefQuestion[] = [
  ...coreQuestions,
  ...intentQuestions,
  ...slideQuestions,
  ...infographicQuestions,
];

/**
 * 質問をIDで検索
 */
export function findQuestionById(id: string): BriefQuestion | undefined {
  return allQuestions.find((q) => q.id === id);
}

/**
 * カテゴリ別質問取得
 */
export function getQuestionsByCategory(
  category: 'core' | 'intent' | 'source' | 'structure' | 'style' | 'delivery'
): BriefQuestion[] {
  return allQuestions.filter((q) => q.category === category);
}

/**
 * 回答に基づいて次に質問すべき質問リストを取得
 */
export function getEligibleQuestions(
  answers: Record<string, BriefAnswer>
): BriefQuestion[] {
  return allQuestions.filter((q) => q.shouldAsk(answers));
}

/**
 * 必須質問がすべて回答済みかチェック
 */
export function areRequiredQuestionsAnswered(
  answers: Record<string, BriefAnswer>
): boolean {
  const eligibleRequired = allQuestions.filter((q) => q.required && q.shouldAsk(answers));
  return eligibleRequired.every((q) => answers[q.id] !== undefined);
}
