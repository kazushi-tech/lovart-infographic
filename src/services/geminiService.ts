import { GoogleGenAI, Type } from '@google/genai';
import { InterviewData, SlideData, ResearchPacket, SourceRef } from '../demoData';
import { getDesignToken } from '../designTokens';
import { compileAllSlides } from '../slides/layoutCompiler';
import { sanitizeAllSlides } from '../slides/sanitize';
import { buildRichBrief, formatRichBriefNarrative, type RichBriefContext } from '../interview/brief';
import { buildStructureGuide, buildQualityConstraints, buildAntiPatternWarnings, buildPageRequirementsTable } from './promptTemplates';
import type { AnswerEntry, InterviewFieldId } from '../interview/schema';

/**
 * Semantic-first schema: AI returns meaning, not coordinates.
 * The layout compiler handles positioning.
 */
const slideStructureSchema = {
  type: Type.ARRAY,
  description: "An array of infographic slides with semantic content. Do NOT include visual coordinates — only meaning.",
  items: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING, description: "A unique identifier for the slide (e.g., 'slide-1')" },
      pageNumber: { type: Type.INTEGER, description: "The page number" },
      title: { type: Type.STRING, description: "The title of the slide" },
      bgPrompt: { type: Type.STRING, description: "A detailed prompt for an AI image generator to create a background image for this slide. The image should be abstract, professional, and match the theme. DO NOT include text in the image prompt. Must be in English." },
      pageKind: { type: Type.STRING, description: "cover | executive-summary | problem-analysis | comparison | roadmap | deep-dive | decision-cta" },
      eyebrow: { type: Type.STRING, description: "セクションラベル（例: 01 / AI戦略ブリーフィング）" },
      headline: { type: Type.STRING, description: "大見出し（10〜20文字）" },
      subheadline: { type: Type.STRING, description: "補足説明文（12〜24文字、表紙のみ）" },
      facts: { type: Type.ARRAY, items: { type: Type.STRING }, description: "要点（各60文字以内、最大3つ）" },
      kpis: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            label: { type: Type.STRING },
            value: { type: Type.STRING },
            unit: { type: Type.STRING }
          }
        },
        description: "KPI（最大2つ）"
      },
      sections: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            bullets: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        },
        description: "セクション（最大2つ、各3弾丸まで）"
      },
      comparisonRows: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            topic: { type: Type.STRING },
            current: { type: Type.STRING },
            future: { type: Type.STRING }
          }
        },
        description: "比較行（3行固定）"
      },
      roadmapPhases: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            phase: { type: Type.INTEGER },
            title: { type: Type.STRING },
            bullets: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        },
        description: "ロードマップフェーズ（3つ固定）"
      },
      actionItems: { type: Type.ARRAY, items: { type: Type.STRING }, description: "アクション項目（最大3つ）" },
      takeaways: { type: Type.ARRAY, items: { type: Type.STRING }, description: "要点まとめ（最大3つ）" },
      sourceNote: { type: Type.STRING, description: "出典（例: Source: IDC, Gartner 各社レポート (2025)）" },
      evidenceRefs: { type: Type.ARRAY, items: { type: Type.STRING }, description: "この slide が参照する EvidenceClaim の id 配列" },
    },
    required: ["id", "pageNumber", "title", "bgPrompt", "pageKind", "eyebrow", "headline"]
  }
};

const RESEARCH_MODEL = 'gemini-3-flash-preview';
const STRUCTURE_MODEL = 'gemini-3-pro-preview';
const BACKGROUND_IMAGE_MODEL = 'gemini-3-pro-image-preview';

/**
 * Build an evidence context block for the generation prompt.
 * When a ResearchPacket is available, the AI is constrained to use only these claims.
 */
function buildEvidenceContext(packet?: ResearchPacket): string {
  if (!packet || packet.claims.length === 0) {
    return `
### 数値データについて
- 信頼できる出典が確認できない数値は使用しない
- 数値を含む場合は sourceNote に出典を明記する
- 出典が不明な場合は定性的表現（「増加傾向」「大幅に改善」等）を使う
`;
  }

  const claimLines = packet.claims.map(c => {
    const src = packet.sources.find(s => s.id === c.sourceId);
    const srcLabel = src ? `${src.publisher || src.title} (${src.publishedAt?.slice(0, 4) || '年不明'})` : '出典不明';
    return `- [${c.id}] ${c.text}${c.metricValue ? ` → ${c.metricValue}${c.metricUnit || ''}` : ''} (${srcLabel})`;
  }).join('\n');

  const warningLines = packet.warnings.length > 0
    ? `\n⚠ 注意: ${packet.warnings.join('; ')}`
    : '';

  return `
### リサーチ結果（以下のデータのみ使用可能）
${packet.summary}

#### 利用可能なエビデンス
${claimLines}
${warningLines}

### 数値利用ルール
- KPI / fact / comparison の数値は、上記エビデンス（[claim-N]）からのみ引用する
- evidenceRefs フィールドに使用した claim の id を記載する
- エビデンスにない数値を捏造しない
- 数値の精度を勝手に変えない（例: 50%を47.3%にしない）
- エビデンスが不足する場合は定性的表現に切り替える
`;
}

/**
 * Build sourceNote string from SourceRef array for display purposes.
 */
export function buildSourceNote(sources: SourceRef[]): string {
  if (sources.length === 0) return '';
  const labels = sources.map(s => {
    const year = s.publishedAt?.slice(0, 4) || '';
    return `${s.publisher || s.title}${year ? ` (${year})` : ''}`;
  });
  return `Source: ${labels.join(', ')}`;
}

export async function generateSlideStructure(
  interviewData: Partial<InterviewData>,
  apiKey: string,
  researchPacket?: ResearchPacket,
  answers?: Partial<Record<InterviewFieldId, AnswerEntry>>,
  followUpAnswers?: Array<{ parentFieldId: string; label: string; promptHint?: string }>,
): Promise<SlideData[]> {
  if (!apiKey) {
    throw new Error('API key is required');
  }
  const ai = new GoogleGenAI({ apiKey });

  const count = parseInt(interviewData.slideCount || '5', 10);
  const token = getDesignToken(interviewData.styleId);

  // Build rich brief from answers if available, else fall back to interviewData
  let briefNarrative: string;
  if (answers && Object.keys(answers).length > 0) {
    const richBrief = buildRichBrief(
      answers as Record<string, AnswerEntry>,
      researchPacket,
      followUpAnswers
    );
    briefNarrative = formatRichBriefNarrative(richBrief);
  } else {
    briefNarrative = `
## プロジェクト概要
- **テーマ**: ${interviewData.theme || "未指定"}
- **ターゲット読者**: ${interviewData.targetAudience || "未指定"}
- **キーメッセージ**: ${interviewData.keyMessage || "未指定"}
- **トーン**: ${interviewData.tone || "未指定"}
- **スライド枚数**: ${count}枚
- **デザインスタイル**: ${interviewData.styleId || "未指定"}
- **補足事項**: ${interviewData.supplementary || "なし"}
`;
  }

  const structureGuide = buildStructureGuide(count);
  const evidenceContext = buildEvidenceContext(researchPacket);
  const qualityConstraints = buildQualityConstraints();
  const antiPatterns = buildAntiPatternWarnings();
  const pageReqs = buildPageRequirementsTable();

  const prompt = `
あなたはプロのインフォグラフィックデザイナーです。以下の要件に基づいて、${count}枚のスライドの**意味的構造**を作成してください。

${briefNarrative}

### 重要: セマンティック出力のみ
座標やフォントサイズは出力しないでください。アプリ側でレイアウトを自動計算します。
eyebrow, headline, facts, kpis, sections などの意味的フィールドだけを返してください。

${pageReqs}

### 枚数に応じたページ種別の構成
${structureGuide}
${evidenceContext}
${qualityConstraints}
${antiPatterns}
### 追加コンテンツルール
- sourceNoteはデータを引用するスライドに必ず付ける
- QAで収集した情報は必ずどこかのスライドに反映する
- bgPromptは必ず英語にする
  `;


  try {
    const response = await ai.models.generateContent({
      model: STRUCTURE_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: slideStructureSchema,
        temperature: 0.7,
      }
    });

    const jsonStr = response.text?.trim() || "[]";
    const rawSlides: SlideData[] = JSON.parse(jsonStr);

    // Attach research sources to slides that reference evidence
    const slidesWithSources = rawSlides.map(slide => {
      const slideWithDefaults = {
        ...slide,
        imageUrl: '',
        elements: [],
      };

      // If we have a research packet, attach relevant sources
      if (researchPacket && slide.evidenceRefs && slide.evidenceRefs.length > 0) {
        const referencedSourceIds = new Set<string>();
        for (const claimId of slide.evidenceRefs) {
          const claim = researchPacket.claims.find(c => c.id === claimId);
          if (claim) referencedSourceIds.add(claim.sourceId);
        }
        const slideSources = researchPacket.sources.filter(s => referencedSourceIds.has(s.id));
        slideWithDefaults.sources = slideSources;

        // Build sourceNote from actual sources if not already set
        if (!slideWithDefaults.sourceNote && slideSources.length > 0) {
          slideWithDefaults.sourceNote = buildSourceNote(slideSources);
        }
      }

      return slideWithDefaults;
    });

    return sanitizeAllSlides(compileAllSlides(slidesWithSources, token));
  } catch (error) {
    console.error("Error generating slide structure:", error);
    throw error;
  }
}

export async function generateBackgroundImage(prompt: string, apiKey: string): Promise<string> {
  if (!apiKey) {
    throw new Error('API key is required');
  }
  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: BACKGROUND_IMAGE_MODEL,
      contents: {
        parts: [{ text: prompt + ", abstract, professional business presentation background, no text, high quality, 16:9 aspect ratio" }]
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9",
          imageSize: "1K"
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }

    throw new Error("No image data found in response");
  } catch (error) {
    console.error("Error generating background image:", error);
    throw error;
  }
}
