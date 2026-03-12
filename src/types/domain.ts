/**
 * Domain Types for Lovart Infographic
 *
 * Core domain models for slide rendering, interview flow, and UI components.
 */

export interface ElementData {
  id: string;
  type: 'text' | 'kpi' | 'card';
  content: string;
  x: number;
  y: number;
  width?: number;
  fontSize?: number;
  color?: string;
  fontWeight?: string;
  textAlign?: 'left' | 'center' | 'right';
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

  /** 外部インフォグラフィック用プロンプトパッケージ（内部使用） */
  _externalPrompt?: string;
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
