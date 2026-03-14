import { GoogleGenAI, Type } from '@google/genai';
import { InterviewData, SlideData, ResearchPacket, SourceRef, PageKind } from '../demoData';
import { getDesignToken } from '../designTokens';
import { compileAllSlides } from '../slides/layoutCompiler';
import { sanitizeAllSlides } from '../slides/sanitize';
import { buildRichBrief, formatRichBriefNarrative, type RichBriefContext } from '../interview/brief';
import { buildStructureGuide, buildQualityConstraints, buildAntiPatternWarnings, buildPageRequirementsTable, SLIDE_STRUCTURES } from './promptTemplates';
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
const STRUCTURE_MODEL = 'gemini-3-flash-preview';
const BACKGROUND_IMAGE_MODEL = 'gemini-3-pro-image-preview';
const STRUCTURE_SCHEMA_TIMEOUT_MS = 18000;
const STRUCTURE_FALLBACK_TIMEOUT_MS = 10000;
const BACKGROUND_TIMEOUT_MS = 20000;

function abortAfter(ms: number): { signal: AbortSignal; cleanup: () => void } {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error(`Timed out after ${ms}ms`)), ms);
  return {
    signal: controller.signal,
    cleanup: () => clearTimeout(timer),
  };
}

function extractJsonPayload(text: string): string {
  const trimmed = text.trim();
  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return fencedMatch?.[1]?.trim() || trimmed;
}

function parseSlideResponse(text: string): SlideData[] {
  const jsonPayload = extractJsonPayload(text);
  const parsed = JSON.parse(jsonPayload);
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error('スライド構成の生成結果が空でした');
  }
  return parsed as SlideData[];
}

async function requestStructuredSlides(
  ai: GoogleGenAI,
  prompt: string,
  useSchema: boolean,
  timeoutMs: number,
): Promise<SlideData[]> {
  const { signal, cleanup } = abortAfter(timeoutMs);

  try {
    const response = await ai.models.generateContent({
      model: STRUCTURE_MODEL,
      contents: prompt,
      config: {
        abortSignal: signal,
        responseMimeType: 'application/json',
        ...(useSchema ? { responseSchema: slideStructureSchema } : {}),
        temperature: useSchema ? 0.4 : 0.2,
        maxOutputTokens: 4096,
      }
    });

    const text = response.text?.trim() || '';
    if (!text) {
      throw new Error('モデルからスライド構成が返されませんでした');
    }

    return parseSlideResponse(text);
  } finally {
    cleanup();
  }
}

function truncateText(value: string, maxLength: number): string {
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }
  return `${normalized.slice(0, Math.max(0, maxLength - 1)).trim()}…`;
}

function collectFollowUpLabels(
  followUpAnswers?: Array<{ parentFieldId: string; label: string; promptHint?: string }>
): Record<string, string[]> {
  const byField: Record<string, string[]> = {};
  for (const answer of followUpAnswers || []) {
    const label = answer.label.trim();
    if (!label) {
      continue;
    }
    byField[answer.parentFieldId] ??= [];
    byField[answer.parentFieldId].push(label);
  }
  return byField;
}

function createEyebrow(pageNumber: number, label: string): string {
  return `${String(pageNumber).padStart(2, '0')} / ${label}`;
}

function getFallbackStructure(count: number): PageKind[] {
  if (SLIDE_STRUCTURES[count]) {
    return SLIDE_STRUCTURES[count];
  }

  if (count <= 3) {
    return SLIDE_STRUCTURES[3];
  }

  if (count === 4) {
    return ['cover', 'executive-summary', 'comparison', 'decision-cta'];
  }

  const kinds: PageKind[] = ['cover', 'executive-summary', 'problem-analysis'];
  const remaining = count - 4;
  for (let index = 0; index < remaining; index += 1) {
    const isLastMiddle = index === remaining - 1;
    kinds.push(isLastMiddle && count >= 7 ? 'roadmap' : 'deep-dive');
  }
  kinds.push('decision-cta');
  return kinds;
}

function buildFallbackKpis(packet?: ResearchPacket): { label: string; value: string; unit: string }[] {
  if (!packet) {
    return [];
  }
  return packet.claims
    .filter(claim => claim.metricValue)
    .slice(0, 2)
    .map((claim, index) => ({
      label: truncateText(claim.text.replace(/\s+/g, ' '), 20) || `指標${index + 1}`,
      value: claim.metricValue || '',
      unit: claim.metricUnit || '',
    }));
}

function buildFallbackBgPrompt(theme: string, keyMessage: string, pageKind: PageKind): string {
  const subject = theme.trim() || 'business strategy';
  const focus = keyMessage.trim() || 'decision making';
  return `abstract professional presentation background, ${subject}, ${focus}, ${pageKind}, blue and graphite palette, no text, 16:9`;
}

function buildFallbackSlides(
  interviewData: Partial<InterviewData>,
  count: number,
  researchPacket?: ResearchPacket,
  followUpAnswers?: Array<{ parentFieldId: string; label: string; promptHint?: string }>,
): SlideData[] {
  const theme = interviewData.theme?.trim() || '未指定テーマ';
  const audience = interviewData.targetAudience?.trim() || '関係者';
  const keyMessage = interviewData.keyMessage?.trim() || '判断材料を整理する';
  const supplementary = interviewData.supplementary?.trim() || '';
  const followUps = collectFollowUpLabels(followUpAnswers);
  const themeFocus = followUps.theme?.[0] || '';
  const audienceDetail = followUps.targetAudience?.[0] || '';
  const messageDetail = followUps.keyMessage?.[0] || '';
  const kpis = buildFallbackKpis(researchPacket);
  const evidenceRefs = (researchPacket?.claims || []).slice(0, 2).map(claim => claim.id);
  const sourceNote = researchPacket?.sources?.length ? buildSourceNote(researchPacket.sources.slice(0, 2)) : '';
  const structure = getFallbackStructure(count);
  const baseHeadline = truncateText(themeFocus || theme.replace(/について/g, '').trim(), 20) || '重点論点を整理する';
  const summaryFacts = [
    truncateText(`${audience}${audienceDetail ? `向けに${audienceDetail}` : '向け'}の判断材料を整理`, 36),
    truncateText(messageDetail || keyMessage, 36),
    truncateText(researchPacket?.summary || `${theme}の現状と優先課題を分かりやすく整理`, 36),
  ].filter(Boolean);

  return structure.map((pageKind, index) => {
    const pageNumber = index + 1;
    const shared = {
      id: `slide-${pageNumber}`,
      pageNumber,
      title: `${theme} - ${pageKind}`,
      imageUrl: '',
      bgPrompt: buildFallbackBgPrompt(theme, keyMessage, pageKind),
      elements: [],
      pageKind,
      sourceNote,
      evidenceRefs,
      sources: researchPacket?.sources || [],
    } satisfies SlideData;

    switch (pageKind) {
      case 'cover':
        return {
          ...shared,
          eyebrow: createEyebrow(pageNumber, '課題設定'),
          headline: truncateText(`${baseHeadline}を具体化する`, 18),
          subheadline: truncateText(messageDetail || keyMessage || `${theme}の要点を一枚で把握する`, 24),
          kpis,
        };
      case 'executive-summary':
        return {
          ...shared,
          eyebrow: createEyebrow(pageNumber, '要点整理'),
          headline: truncateText('結論と判断軸を先に示す', 18),
          facts: summaryFacts.slice(0, 3),
          kpis,
        };
      case 'problem-analysis':
        return {
          ...shared,
          eyebrow: createEyebrow(pageNumber, '現状分析'),
          headline: truncateText('現状の詰まりどころを特定', 18),
          facts: [
            truncateText(`${theme}は論点が広く、方針がぼやけやすい`, 36),
          ],
          kpis: kpis.slice(0, 1),
          sections: [
            {
              title: '見えている課題',
              bullets: [
                truncateText(audienceDetail || `${audience}ごとに見たい情報が違う`, 28),
                truncateText(messageDetail || '結論が抽象的だと意思決定につながりにくい', 28),
              ],
            },
            {
              title: '今回そろえる論点',
              bullets: [
                truncateText(themeFocus || '何を優先するテーマなのかを定義する', 28),
                truncateText('次に取るべき判断と行動を明示する', 28),
              ],
            },
          ],
        };
      case 'comparison':
        return {
          ...shared,
          eyebrow: createEyebrow(pageNumber, '比較判断'),
          headline: truncateText('現状維持より見直しが有利', 18),
          comparisonRows: [
            { topic: '論点の明確さ', current: '判断軸が分散', future: '重点テーマを明示' },
            { topic: '意思決定のしやすさ', current: '結論が抽象的', future: truncateText(messageDetail || keyMessage, 18) },
            { topic: '実行イメージ', current: '次の一手が曖昧', future: '優先施策と順序を提示' },
          ],
        };
      case 'roadmap':
        return {
          ...shared,
          eyebrow: createEyebrow(pageNumber, '実行計画'),
          headline: truncateText('3段階で具体化する', 18),
          roadmapPhases: [
            { phase: 1, title: '前提整理', bullets: ['対象読者と論点を固定', '使う数値根拠を確定'] },
            { phase: 2, title: '優先順位化', bullets: ['比較軸を明示', '打ち手候補を整理'] },
            { phase: 3, title: '実行判断', bullets: ['次のアクションを決定', '社内共有に展開'] },
          ],
        };
      case 'decision-cta':
        return {
          ...shared,
          eyebrow: createEyebrow(pageNumber, '次の判断'),
          headline: truncateText('次に決めることを明確化', 18),
          actionItems: [
            truncateText(themeFocus || '優先するテーマを一つに定める', 28),
            truncateText(messageDetail || '判断に必要な比較軸をそろえる', 28),
            truncateText('実行責任者と期限を決める', 28),
          ],
          takeaways: [
            truncateText(`${theme}は論点整理だけで説得力が上がる`, 28),
            truncateText(`${audience}が判断しやすい構成へ寄せる`, 28),
            truncateText(supplementary || '次のアクションまで示して終える', 28),
          ],
        };
      case 'deep-dive':
      default:
        return {
          ...shared,
          eyebrow: createEyebrow(pageNumber, '詳細検討'),
          headline: truncateText('重点論点を具体策に落とす', 18),
          facts: [
            truncateText(themeFocus || `${theme}の焦点を一つに絞る`, 32),
          ],
          kpis: kpis.slice(0, 1),
          sections: [
            {
              title: '見るべきポイント',
              bullets: [
                truncateText(messageDetail || keyMessage, 28),
                truncateText(audienceDetail || `${audience}に合わせて説明粒度を変える`, 28),
              ],
            },
            {
              title: 'スライドで示す内容',
              bullets: [
                truncateText('比較・根拠・実行案を一貫させる', 28),
                truncateText('結論を一文で言い切る', 28),
              ],
            },
          ],
        };
    }
  });
}

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
    let rawSlides: SlideData[];
    try {
      rawSlides = await requestStructuredSlides(ai, prompt, true, STRUCTURE_SCHEMA_TIMEOUT_MS);
    } catch (schemaError) {
      console.warn('Structured schema generation failed, retrying without schema:', schemaError);
      try {
        rawSlides = await requestStructuredSlides(
          ai,
          `${prompt}\n\n### 出力形式の最終指示\n- JSON配列のみを返す\n- Markdownや説明文は不要\n- 必ず1枚以上のslideを返す`,
          false,
          STRUCTURE_FALLBACK_TIMEOUT_MS,
        );
      } catch (fallbackError) {
        console.warn('JSON-only generation failed, using deterministic fallback deck:', fallbackError);
        rawSlides = buildFallbackSlides(interviewData, count, researchPacket, followUpAnswers);
      }
    }

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
    const { signal, cleanup } = abortAfter(BACKGROUND_TIMEOUT_MS);
    try {
      const response = await ai.models.generateContent({
        model: BACKGROUND_IMAGE_MODEL,
        contents: {
          parts: [{ text: prompt + ", abstract, professional business presentation background, no text, high quality, 16:9 aspect ratio" }]
        },
        config: {
          abortSignal: signal,
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
    } finally {
      cleanup();
    }
  } catch (error) {
    console.error("Error generating background image:", error);
    throw error;
  }
}
