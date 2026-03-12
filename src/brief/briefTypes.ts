/**
 * Brief System Type Definitions
 *
 * 適応的ブリーフシステムのための型定義
 */

export type BriefIntent =
  | 'executive'
  | 'proposal'
  | 'comparison'
  | 'plan'
  | 'report'
  | 'whitepaper-infographic';

export interface BriefQuestionOption {
  id: string;
  label: string;
  description?: string;
}

export interface BriefQuestion {
  id: string;
  prompt: string;
  inputMode: 'text' | 'single-choice' | 'multi-choice' | 'textarea';
  required: boolean;
  category: 'core' | 'intent' | 'source' | 'structure' | 'style' | 'delivery';
  options?: BriefQuestionOption[];
  shouldAsk: (answers: Record<string, unknown>) => boolean;
  summarize: (answer: unknown) => string;
}

export interface CompiledBrief {
  title: string;
  objective: string;
  sourceMaterialSummary: string;
  targetAudienceSummary: string;
  intentSummary: string;
  outputTargetSummary: string;
  evidenceExpectations: string;
  visualPriorities: string;
  requiredInclusions: string[];
  deliveryConstraints: string[];
  slideGuidance?: string;
  externalImageGuidance?: string;
  promptText: string;
}

export interface BriefAnswer {
  questionId: string;
  value: unknown;
  timestamp: string;
}
