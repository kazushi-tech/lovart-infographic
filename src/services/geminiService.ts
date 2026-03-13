import { GoogleGenAI, Type } from '@google/genai';
import { InterviewData, SlideData } from '../demoData';
import { getDesignToken } from '../designTokens';
import { compileAllSlides } from '../slides/layoutCompiler';
import { sanitizeAllSlides } from '../slides/sanitize';

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
    },
    required: ["id", "pageNumber", "title", "bgPrompt", "pageKind", "eyebrow", "headline"]
  }
};

export async function generateSlideStructure(
  interviewData: Partial<InterviewData>,
  apiKey: string
): Promise<SlideData[]> {
  if (!apiKey) {
    throw new Error('API key is required');
  }
  const ai = new GoogleGenAI({ apiKey });

  const count = parseInt(interviewData.slideCount || '5', 10);
  const token = getDesignToken(interviewData.styleId);
  let structureGuide = '';
  if (count === 3) {
    structureGuide = '3枚: cover → problem-analysis → decision-cta';
  } else if (count === 5) {
    structureGuide = '5枚: cover → executive-summary → problem-analysis → comparison → decision-cta';
  } else if (count === 8) {
    structureGuide = '8枚: cover → executive-summary → problem-analysis → deep-dive × 2 → comparison → roadmap → decision-cta';
  } else if (count === 10) {
    structureGuide = '10枚: cover → executive-summary → problem-analysis → deep-dive × 4 → comparison → roadmap → decision-cta';
  }

  const prompt = `
あなたはプロのインフォグラフィックデザイナーです。以下の要件に基づいて、${count}枚のスライドの**意味的構造**を作成してください。

テーマ: ${interviewData.theme || "未指定"}
ターゲット読者: ${interviewData.targetAudience || "未指定"}
キーメッセージ: ${interviewData.keyMessage || "未指定"}
スタイル: ${interviewData.styleId || "未指定"}
スライド枚数: ${count}枚
トーン＆マナー: ${interviewData.tone || "未指定"}
補足事項: ${interviewData.supplementary || "なし"}

### 重要: セマンティック出力のみ
座標やフォントサイズは出力しないでください。アプリ側でレイアウトを自動計算します。
eyebrow, headline, facts, kpis, sections などの意味的フィールドだけを返してください。

### ページ種別ごとの必須要素と制約
| ページ種別 | eyebrow | headline | sub | facts | kpis | 特殊要素 |
|-----------|---------|----------|-----|-------|------|---------|
| cover（表紙） | ○ | ○ | ○ | - | 1個 | - |
| executive-summary | ○ | ○ | - | 1-2 | 1-2 | - |
| problem-analysis | ○ | ○ | - | 1 | 1-2 | sections（2つ、各3弾丸まで） |
| comparison | ○ | ○ | - | - | - | comparisonRows（3行固定） |
| roadmap | ○ | ○ | - | - | - | roadmapPhases（3つ固定） |
| deep-dive | ○ | ○ | - | 1 | 1-2 | sections（2つ、各3弾丸まで） |
| decision-cta | ○ | ○ | - | - | - | actionItems（3つ）+ takeaways（2-3） |

### 枚数に応じたページ種別の構成
${structureGuide}

### コンテンツルール
- 各スライドの主張は**1つ**に絞る
- KPIは最大2件（数値+単位を明確に分離）
- factsは2-3件まで（各60文字以内）
- comparison は3行固定（topic / current / future）
- roadmap は3フェーズ固定
- eyebrowは必ず「NN / セクション名」形式
- sourceNoteはデータを引用するスライドに必ず付ける
- QAで収集した情報は必ずどこかのスライドに反映する
- bgPromptは必ず英語にする
- 全テキストは日本語
  `;


  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: slideStructureSchema,
        temperature: 0.7,
      }
    });

    const jsonStr = response.text?.trim() || "[]";
    const rawSlides: SlideData[] = JSON.parse(jsonStr);

    // Initialize imageUrl, then compile semantic data → positioned elements
    const slidesWithEmptyImages = rawSlides.map(slide => ({
      ...slide,
      imageUrl: '',
      elements: [], // will be replaced by compiler
    }));

    return sanitizeAllSlides(compileAllSlides(slidesWithEmptyImages, token));
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
      model: 'gemini-3.1-flash-image-preview',
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
