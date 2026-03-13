import type { SlideData, ChatMessage, ResearchPacket } from '../demoData';
import type { BriefDraft } from '../interview/schema';

export interface GenerationTiming {
  researchMs?: number;
  structureMs: number;
  backgroundMs?: number;
  totalMs: number;
}

export interface DeckRecord {
  id: string;
  briefDraft: BriefDraft;
  slides: SlideData[];
  messages: ChatMessage[];
  researchPacket?: ResearchPacket;
  timings: GenerationTiming;
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'generated' | 'failed';
}

export interface DeckSummary {
  id: string;
  theme: string;
  slideCount: number;
  status: DeckRecord['status'];
  hasWarnings: boolean;
  updatedAt: string;
}

export function toDeckSummary(record: DeckRecord): DeckSummary {
  return {
    id: record.id,
    theme: record.briefDraft.theme,
    slideCount: record.slides.length,
    status: record.status,
    hasWarnings: record.status === 'failed',
    updatedAt: record.updatedAt,
  };
}
