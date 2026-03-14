import type { InterviewData, ResearchPacket, SlideData } from '../demoData';
import type { AnswerEntry, InterviewFieldId } from '../interview/schema';

interface ApiErrorPayload {
  error?: string;
}

async function parseError(response: Response, fallback: string): Promise<never> {
  try {
    const data = await response.json() as ApiErrorPayload;
    throw new Error(data.error || fallback);
  } catch (error) {
    if (error instanceof Error && error.message !== 'Unexpected end of JSON input') {
      throw error;
    }
    throw new Error(fallback);
  }
}

export async function requestSlideStructure(
  interviewData: Partial<InterviewData>,
  apiKey?: string,
  researchPacket?: ResearchPacket,
  answers?: Partial<Record<InterviewFieldId, AnswerEntry>>,
  followUpAnswers?: Array<{ parentFieldId: string; label: string; promptHint?: string }>,
): Promise<SlideData[]> {
  const response = await fetch('/api/generate-structure', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      interviewData,
      apiKey,
      researchPacket,
      answers,
      followUpAnswers,
    }),
  });

  if (!response.ok) {
    await parseError(response, 'スライド構成の生成に失敗しました');
  }

  return response.json() as Promise<SlideData[]>;
}

export async function requestBackgroundImage(
  prompt: string,
  apiKey?: string
): Promise<string> {
  const response = await fetch('/api/generate-background', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, apiKey }),
  });

  if (!response.ok) {
    await parseError(response, '背景画像の生成に失敗しました');
  }

  const data = await response.json() as { imageUrl?: string };
  if (!data.imageUrl) {
    throw new Error('背景画像データが返されませんでした');
  }

  return data.imageUrl;
}
