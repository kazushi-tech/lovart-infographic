export type ElementType =
  | 'text'
  | 'kpi'
  | 'card'
  | 'badge'
  | 'divider'
  | 'bullet-list'
  | 'comparison-row'
  | 'roadmap-step'
  | 'chip';

export interface ElementData {
  id: string;
  type: ElementType;
  content: string;
  x: number;
  y: number;
  width?: number;
  fontSize?: number;
  color?: string;
  fontWeight?: string;
  textAlign?: 'left' | 'center' | 'right';
  variant?: string;
  background?: string;
  borderColor?: string;
  icon?: string;
}

export type PageKind = 'cover' | 'executive-summary' | 'problem-analysis' | 'comparison' | 'roadmap' | 'deep-dive' | 'decision-cta';

export interface SlideData {
  id: string;
  pageNumber: number;
  title: string;
  imageUrl: string;
  bgPrompt?: string;
  elements: ElementData[];
  
  pageKind?: PageKind;
  eyebrow?: string;
  headline?: string;
  subheadline?: string;
  facts?: string[];
  kpis?: { label: string; value: string; unit: string }[];
  sections?: { title: string; bullets: string[] }[];
  comparisonRows?: { topic: string; current: string; future: string }[];
  roadmapPhases?: { phase: number; title: string; bullets: string[] }[];
  actionItems?: string[];
  takeaways?: string[];
  sourceNote?: string;
}

export interface StyleOption {
  id: string;
  label: string;
  desc?: string;
  imageUrl?: string;
}

export interface InterviewData {
  theme: string;
  targetAudience: string;
  keyMessage: string;
  styleId: string;
  slideCount?: string;
  tone?: string;
  supplementary: string;
}

export type InputMode = 'text' | 'options' | 'none';
export type MessageStatus = 'sending' | 'sent' | 'error';

export interface ChatMessage {
  id: string;
  role: 'ai' | 'user' | 'system' | 'assistant';
  text: string;
  options?: StyleOption[];
  optionsType?: 'grid' | 'list';
  inputMode?: InputMode;
  status?: MessageStatus;
  timestamp: number;
}

export const MOCK_STYLES: StyleOption[] = [
  { id: 'formal', label: 'フォーマル' },
  { id: 'editorial', label: 'エディトリアル' },
  { id: 'intelligent', label: 'インテリジェント' },
  { id: 'clear', label: '図解クリア' },
];

export const MOCK_INTERVIEW_DATA: InterviewData = {
  theme: 'リモートワークの効率化',
  targetAudience: '経営層・IT部門責任者',
  keyMessage: 'テクノロジー活用による生産性向上とコスト削減',
  styleId: 'intelligent',
  supplementary: '経営会議向けに、青を基調とした落ち着いたトーンで作成してください。',
};

import { compileAllSlides } from './slides/layoutCompiler';
import { DESIGN_TOKENS } from './designTokens';

/** Semantic mock slides — elements are compiled at import time via layoutCompiler */
const MOCK_SLIDES_SEMANTIC: Omit<SlideData, 'elements'>[] = [
  {
    id: 'slide-1',
    pageNumber: 1,
    title: '戦略的リモートワークの実現',
    imageUrl: 'https://picsum.photos/seed/slide1/1280/720',
    pageKind: 'cover',
    eyebrow: '01 / 導入',
    headline: '戦略的リモートワーク',
    subheadline: 'リモートワークの生産性を最大化する',
    kpis: [{ label: '生産性向上率', value: '20', unit: '%' }],
  },
  {
    id: 'slide-2',
    pageNumber: 2,
    title: '現状の課題とボトルネック',
    imageUrl: 'https://picsum.photos/seed/slide2/1280/720',
    pageKind: 'problem-analysis',
    eyebrow: '02 / 課題分析',
    headline: '現状の課題',
    facts: ['コミュニケーションの分断', '情報共有の遅延', '帰属意識の低下'],
  },
  {
    id: 'slide-3',
    pageNumber: 3,
    title: '次世代プラットフォームの導入',
    imageUrl: 'https://picsum.photos/seed/slide3/1280/720',
    pageKind: 'executive-summary',
    eyebrow: '03 / 解決策',
    headline: '次世代プラットフォームの導入',
    facts: ['統合型ワークスペースの構築'],
  },
];

export const MOCK_SLIDES: SlideData[] = compileAllSlides(
  MOCK_SLIDES_SEMANTIC.map(s => ({ ...s, elements: [] })),
  DESIGN_TOKENS.professional,
);

// --- Demo State Presets ---
export type AppState = 'empty' | 'midInterview' | 'styleSelection' | 'briefComplete' | 'generatedSlides' | 'selectedElement';

const baseTime = Date.now() - 10000;

export const DEMO_STATES: Record<AppState, { messages: ChatMessage[], interviewData: Partial<InterviewData>, isGenerated: boolean }> = {
  empty: {
    messages: [
      { id: 'm1', role: 'ai', text: 'インフォグラフィックの作成を始めましょう。まずは、テーマやタイトルを教えてください。', inputMode: 'text', timestamp: baseTime }
    ],
    interviewData: {},
    isGenerated: false
  },
  midInterview: {
    messages: [
      { id: 'm1', role: 'ai', text: 'インフォグラフィックの作成を始めましょう。まずは、テーマやタイトルを教えてください。', timestamp: baseTime },
      { id: 'm2', role: 'user', text: 'リモートワークの効率化について', timestamp: baseTime + 1000 },
      { id: 'm3', role: 'ai', text: 'ありがとうございます。次に、この資料のターゲット読者（誰に伝えたいか）を教えてください。', inputMode: 'text', timestamp: baseTime + 2000 }
    ],
    interviewData: { theme: 'リモートワークの効率化について' },
    isGenerated: false
  },
  styleSelection: {
    messages: [
      { id: 'm1', role: 'ai', text: 'インフォグラフィックの作成を始めましょう。まずは、テーマやタイトルを教えてください。', timestamp: baseTime },
      { id: 'm2', role: 'user', text: 'リモートワークの効率化について', timestamp: baseTime + 1000 },
      { id: 'm3', role: 'ai', text: 'ありがとうございます。次に、この資料のターゲット読者（誰に伝えたいか）を教えてください。', timestamp: baseTime + 2000 },
      { id: 'm4', role: 'user', text: '経営層・IT部門責任者', timestamp: baseTime + 3000 },
      { id: 'm5', role: 'ai', text: '承知しました。ターゲットに一番伝えたい「キーメッセージ」は何ですか？', timestamp: baseTime + 4000 },
      { id: 'm6', role: 'user', text: 'テクノロジー活用による生産性向上とコスト削減', timestamp: baseTime + 5000 },
      { id: 'm7', role: 'ai', text: '素晴らしいですね。次に、デザインのスタイルを選んでください。', inputMode: 'options', options: MOCK_STYLES, timestamp: baseTime + 6000 }
    ],
    interviewData: { theme: 'リモートワークの効率化について', targetAudience: '経営層・IT部門責任者', keyMessage: 'テクノロジー活用による生産性向上とコスト削減' },
    isGenerated: false
  },
  briefComplete: {
    messages: [
      { id: 'm1', role: 'ai', text: 'インフォグラフィックの作成を始めましょう。まずは、テーマやタイトルを教えてください。', timestamp: baseTime },
      { id: 'm2', role: 'user', text: 'リモートワークの効率化について', timestamp: baseTime + 1000 },
      { id: 'm3', role: 'ai', text: 'ありがとうございます。次に、この資料のターゲット読者（誰に伝えたいか）を教えてください。', timestamp: baseTime + 2000 },
      { id: 'm4', role: 'user', text: '経営層・IT部門責任者', timestamp: baseTime + 3000 },
      { id: 'm5', role: 'ai', text: '承知しました。ターゲットに一番伝えたい「キーメッセージ」は何ですか？', timestamp: baseTime + 4000 },
      { id: 'm6', role: 'user', text: 'テクノロジー活用による生産性向上とコスト削減', timestamp: baseTime + 5000 },
      { id: 'm7', role: 'ai', text: '素晴らしいですね。次に、デザインのスタイルを選んでください。', timestamp: baseTime + 6000 },
      { id: 'm8', role: 'user', text: 'インテリジェント', timestamp: baseTime + 7000 },
      { id: 'm9', role: 'ai', text: '最後に、ページ数や色合いなど、補足の指示があれば教えてください。（なければ「なし」で構いません）', timestamp: baseTime + 8000 },
      { id: 'm10', role: 'user', text: '経営会議向けに、青を基調とした落ち着いたトーンで作成してください。', timestamp: baseTime + 9000 },
      { id: 'm11', role: 'ai', text: 'ありがとうございます！以下の内容で要件がまとまりました。確認して生成ボタンを押してください。', inputMode: 'none', timestamp: baseTime + 10000 }
    ],
    interviewData: MOCK_INTERVIEW_DATA,
    isGenerated: false
  },
  generatedSlides: {
    messages: [
      { id: 'm11', role: 'ai', text: 'ありがとうございます！以下の内容で要件がまとまりました。確認して生成ボタンを押してください。', timestamp: baseTime + 10000 },
      { id: 'm12', role: 'system', text: 'スライドの生成が完了しました。中央のプレビューエリアで確認・編集が可能です。', inputMode: 'none', timestamp: baseTime + 12000 }
    ],
    interviewData: MOCK_INTERVIEW_DATA,
    isGenerated: true
  },
  selectedElement: {
    messages: [
      { id: 'm11', role: 'ai', text: 'ありがとうございます！以下の内容で要件がまとまりました。確認して生成ボタンを押してください。', timestamp: baseTime + 10000 },
      { id: 'm12', role: 'system', text: 'スライドの生成が完了しました。中央のプレビューエリアで確認・編集が可能です。', inputMode: 'none', timestamp: baseTime + 12000 }
    ],
    interviewData: MOCK_INTERVIEW_DATA,
    isGenerated: true
  }
};
