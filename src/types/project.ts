/**
 * Project Types for Lovart Infographic
 *
 * Project persistence and lifecycle management.
 * Timestamps are UTC ISO 8601 strings (e.g., new Date().toISOString()).
 */

export type ProjectStatus = 'draft' | 'generated';

export type EntryMode = 'guided' | 'detailed-brief';

export type SourceMaterialType = 'theme-only' | 'notes' | 'whitepaper' | 'report' | 'proposal';

export type OutputTarget = 'lovart-slides' | 'external-infographic-image';

/**
 * Project record for persistence.
 *
 * IMPORTANT: Do NOT include API keys in this record for security reasons.
 * API keys are managed separately by the user in the runtime environment.
 */
export interface ProjectRecord {
  id: string;
  title: string;
  description?: string;

  // Input mode configuration
  entryMode: EntryMode;
  sourceMaterialType?: SourceMaterialType;
  outputTarget: OutputTarget;

  // Content
  interviewData?: {
    theme: string;
    targetAudience: string;
    keyMessage: string;
    styleId: string;
    slideCount?: string;
    tone?: string;
    supplementary: string;
  };
  briefContent?: string;

  // Output
  slides?: {
    id: string;
    pageNumber: number;
    title: string;
    imageUrl: string;
    bgPrompt?: string;
  }[];

  // Status and timestamps (UTC ISO 8601 strings)
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
  generatedAt?: string;
}
