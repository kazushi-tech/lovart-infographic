import { GoogleGenAI, Type } from '@google/genai';
import { InterviewData, SlideData, ElementData } from '../types/domain';
import { CompiledBrief } from '../brief/briefTypes';
import { getDesignToken } from '../designTokens';

const slideStructureSchema = {
  type: Type.ARRAY,
  description: "An array of infographic slides.",
  items: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING, description: "A unique identifier for the slide (e.g., 'slide-1')" },
      pageNumber: { type: Type.INTEGER, description: "The page number (1 to 5)" },
      title: { type: Type.STRING, description: "The title of the slide" },
      bgPrompt: { type: Type.STRING, description: "A detailed prompt for an AI image generator to create a background image for this slide. The image should be abstract, professional, and match the theme. DO NOT include text in the image prompt. Must be in English." },
      pageKind: { type: Type.STRING, description: "cover | executive-summary | problem-analysis | comparison | roadmap | deep-dive | decision-cta" },
      eyebrow: { type: Type.STRING, description: "セクションラベル（例: 01 / AI戦略ブリーフィング）" },
      headline: { type: Type.STRING, description: "大見出し（10〜20文字）" },
      subheadline: { type: Type.STRING, description: "補足説明文（12〜24文字、表紙のみ）" },
      facts: { type: Type.ARRAY, items: { type: Type.STRING }, description: "要点（60文字以内）" },
      kpis: { 
        type: Type.ARRAY, 
        items: { 
          type: Type.OBJECT, 
          properties: { 
            label: { type: Type.STRING }, 
            value: { type: Type.STRING }, 
            unit: { type: Type.STRING } 
          } 
        } 
      },
      sections: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: { 
            title: { type: Type.STRING }, 
            bullets: { type: Type.ARRAY, items: { type: Type.STRING } } 
          }
        }
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
        }
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
        }
      },
      actionItems: { type: Type.ARRAY, items: { type: Type.STRING } },
      takeaways: { type: Type.ARRAY, items: { type: Type.STRING } },
      sourceNote: { type: Type.STRING, description: "Source: IDC, Gartner 各社レポート (2025)" },
      elements: {
        type: Type.ARRAY,
        description: "Visual elements to be placed on the slide. You MUST map all the semantic fields above (eyebrow, headline, facts, kpis, etc.) into these visual elements with appropriate X/Y coordinates, font sizes, and colors. The elements array is what actually gets rendered on the screen.",
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING, description: "A unique identifier for the element" },
            type: { type: Type.STRING, description: "The type of element: 'text', 'kpi', or 'card'" },
            content: { type: Type.STRING, description: "The text content in Japanese. For KPI, put label on first line and value+unit on second line." },
            x: { type: Type.INTEGER, description: "X coordinate percentage (0-100)" },
            y: { type: Type.INTEGER, description: "Y coordinate percentage (0-100)" },
            fontSize: { type: Type.INTEGER, description: "Font size in pixels (e.g., 16, 24, 48)" },
            color: { type: Type.STRING, description: "Hex color code (e.g., '#FFFFFF' or '#333333')" },
            fontWeight: { type: Type.STRING, description: "Font weight (e.g., 'normal', 'bold')" },
            textAlign: { type: Type.STRING, description: "Text alignment ('left', 'center', 'right')" },
            width: { type: Type.INTEGER, description: "Optional width percentage (0-100)" }
          },
          required: ["id", "type", "content", "x", "y", "fontSize", "color"]
        }
      }
    },
    required: ["id", "pageNumber", "title", "bgPrompt", "pageKind", "eyebrow", "headline", "elements"]
  }
};

/**
 * スライド数から構成ガイドを生成するヘルパー関数
 */
function getStructureGuide(slideCount: number): string {
  if (slideCount === 3) {
    return '3枚: cover → problem-analysis → decision-cta';
  } else if (slideCount === 5) {
    return '5枚: cover → executive-summary → problem-analysis → comparison → decision-cta';
  } else if (slideCount === 8) {
    return '8枚: cover → executive-summary → problem-analysis → deep-dive × 2 → comparison → roadmap → decision-cta';
  } else if (slideCount === 10) {
    return '10枚: cover → executive-summary → problem-analysis → deep-dive × 4 → comparison → roadmap → decision-cta';
  }
  return '5枚: cover → executive-summary → problem-analysis → comparison → decision-cta';
}

/**
 * 制約事項配列からスライド数を抽出するヘルパー関数
 */
function extractSlideCount(constraints: string[]): number {
  const slideCountConstraint = constraints.find(c => c.match(/スライド数:\s*(\d+)/));
  if (slideCountConstraint) {
    const match = slideCountConstraint.match(/スライド数:\s*(\d+)/);
    return match ? parseInt(match[1], 10) : 5;
  }
  return 5;
}

/**
 * CompiledBrief からスライド構造を生成する
 *
 * @param brief - コンパイルされたブリーフ
 * @param apiKey - Gemini API キー
 * @param styleId - デザインスタイルID（オプション）
 * @returns 生成されたスライドデータ配列
 */
export async function generateSlidesFromBrief(
  brief: CompiledBrief,
  apiKey: string,
  styleId?: string
): Promise<SlideData[]> {
  if (!apiKey) {
    throw new Error('API key is required');
  }
  const ai = new GoogleGenAI({ apiKey });

  // スライド生成の場合、externalImageGuidance がある場合はプロンプトパッケージとして返す
  if (brief.externalImageGuidance) {
    // 外部インフォグラフィック用のプロンプトパッケージを生成
    // 実際の画像生成は行わず、プロンプト情報を含むスライドデータを返す
    const promptPackage = {
      objective: brief.objective,
      prompt: brief.externalImageGuidance,
      constraints: brief.deliveryConstraints.join(', '),
    };

    // プロンプトパッケージを含む形式で返す（特殊フラグを追加）
    return [{
      id: 'prompt-package',
      pageNumber: 1,
      title: brief.title,
      imageUrl: '',
      pageKind: 'cover',
      eyebrow: '01 / External Infographic',
      headline: brief.title,
      elements: [
        {
          id: 'prompt-info',
          type: 'text',
          content: brief.promptText,
          x: 50,
          y: 50,
          fontSize: 16,
          color: '#333333',
        }
      ],
      _externalPrompt: promptPackage as unknown as string,
    }];
  }

  // スライド生成の場合
  const slideCount = extractSlideCount(brief.deliveryConstraints);
  const token = getDesignToken(styleId || 'corporate');
  const structureGuide = getStructureGuide(slideCount);

  const prompt = `
あなたはプロのインフォグラフィックデザイナーです。以下の要件に基づいて、${slideCount}枚のスライド構成を作成してください。

${brief.slideGuidance || brief.promptText}

スライドの情報量をビジネス用ホワイトペーパーレベルに引き上げてください。
各スライドは以下のフィールドを持つJSONオブジェクトとして管理してください。

### ページ種別ごとの必須要素
| ページ種別 | eyebrow | headline | sub | facts | kpis | 特殊要素 |
|-----------|---------|----------|-----|-------|------|---------|
| cover（表紙） | ○ | ○ | ○ | - | 1個 | - |
| executive-summary | ○ | ○ | - | 1-2個 | 1-2個 | - |
| problem-analysis | ○ | ○ | - | 1-2個 | 1-2個 | sections |
| comparison | ○ | ○ | - | - | - | comparisonRows（3行） |
| roadmap | ○ | ○ | - | - | - | roadmapPhases（3つ） |
| deep-dive | ○ | ○ | - | 1-2個 | 1-2個 | sections |
| decision-cta | ○ | ○ | - | - | - | actionItems（3つ）+ takeaways |

### 枚数に応じたページ種別の構成
${structureGuide}

### 全スライド共通ルール
- **eyebrow**は必ず「NN / セクション名」形式で付ける
- **sourceNote**はデータを引用するスライドに必ず付ける
- テキストは全て読みやすいサイズ（最小16px）
- 視覚的階層: headline(大) > subheadline(中) > facts/bullets(小) > sourceNote(極小)

重要: JSONの \`elements\` 配列には、上記で生成したセマンティックな情報（eyebrow, headline, facts, kpisなど）を視覚的な要素として配置してください。
テキスト要素は、X/Y座標(%)を使ってバランスよく配置してください。

### テキストカラー指定（必ずこの色を使うこと）
選択されたスタイル「${token.label}」に基づき、以下の色をそのまま使ってください:
- eyebrow テキスト: ${token.colors.eyebrow}
- headline テキスト: ${token.colors.headline}
- subheadline テキスト: ${token.colors.subheadline}
- 本文・ファクト・箇条書き: ${token.colors.body}
- KPI 値: ${token.colors.kpiValue}
- KPI ラベル: ${token.colors.kpiLabel}
- ソース注記: ${token.colors.sourceNote}

背景画像の上にはオーバーレイが適用されるため、上記の色で十分なコントラストが確保されます。
絶対に #94A3B8 や #CBD5E1 などの中間グレーを使わないでください。
出力は日本語のテキスト要素を含みますが、bgPromptは必ず英語にしてください。
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
    const slides: SlideData[] = JSON.parse(jsonStr);

    // Initialize imageUrl to empty string, it will be filled later
    return slides.map(slide => ({
      ...slide,
      imageUrl: ''
    }));
  } catch (error) {
    console.error("Error generating slide structure from brief:", error);
    throw error;
  }
}

/**
 * InterviewData からスライド構造を生成する（後方互換性のため残す）
 *
 * @deprecated generateSlidesFromBrief を使用してください
 */
export async function generateSlideStructure(
  interviewData: Partial<InterviewData>,
  apiKey: string
): Promise<SlideData[]> {
  // 後方互換性のため、generateSlidesFromBrief を呼び出す
  // CompileBrief を簡易的に生成
  const brief: CompiledBrief = {
    title: interviewData.theme || '未指定テーマ',
    objective: 'インフォグラフィックスライドを生成',
    sourceMaterialSummary: 'ユーザー入力のインタビュー回答',
    targetAudienceSummary: interviewData.targetAudience || '未指定',
    intentSummary: interviewData.keyMessage || '未指定',
    outputTargetSummary: '複数スライド構成のプレゼンテーション形式',
    evidenceExpectations: '出典を明示し、信頼性の高いデータと統計を使用する',
    visualPriorities: interviewData.styleId || 'プロフェッショナル',
    requiredInclusions: [],
    deliveryConstraints: [
      `スライド数: ${interviewData.slideCount || '5'}`,
      `トーン: ${interviewData.tone || 'プロフェッショナル'}`,
    ],
    slideGuidance: `
テーマ: ${interviewData.theme || "未指定"}
ターゲット読者: ${interviewData.targetAudience || "未指定"}
キーメッセージ: ${interviewData.keyMessage || "未指定"}
スタイル: ${interviewData.styleId || "未指定"}
スライド枚数: ${interviewData.slideCount || '5'}枚
トーン＆マナー: ${interviewData.tone || "未指定"}
補足事項: ${interviewData.supplementary || "なし"}
    `,
    promptText: `
テーマ: ${interviewData.theme || "未指定"}
ターゲット読者: ${interviewData.targetAudience || "未指定"}
キーメッセージ: ${interviewData.keyMessage || "未指定"}
    `,
  };

  return generateSlidesFromBrief(brief, apiKey, interviewData.styleId);
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
