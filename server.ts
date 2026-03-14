import 'dotenv/config';
import express from 'express';
import { createServer as createViteServer } from 'vite';

const app = express();
app.use(express.json());

const PORT = parseInt(process.env.PORT || '3000', 10);
const RESEARCH_MODEL = 'gemini-3-flash-preview';

function getServerKeys() {
  const geminiKey = (process.env.GEMINI_API_KEY || '').trim();
  const imageKey = (process.env.IMAGE_API_KEY || process.env.API_KEY || geminiKey || '').trim();
  return { geminiKey, imageKey };
}

function resolveEffectiveKey(serverKey: string, providedKey?: string): string {
  return (serverKey || providedKey || '').trim();
}

// API routes can go here (e.g. for database operations)
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Runtime config endpoint for development only
// Returns fallback API keys for local development.
// In production, keys must be provided by users via UI.
app.get("/api/runtime-config", (req, res) => {
  // Treat any non-production environment as development-like
  // This allows local development with `npm run dev` which doesn't set NODE_ENV
  const isDevLike = process.env.NODE_ENV !== 'production';
  const { geminiKey, imageKey } = getServerKeys();
  res.json({
    hasServerGeminiKey: Boolean(geminiKey),
    hasServerImageKey: Boolean(imageKey),
    devMode: isDevLike,
  });
});

// Research endpoint: accepts a theme and returns a ResearchPacket
// In the current implementation, this uses Gemini to generate grounded research.
// Future: integrate external search APIs for real-time source retrieval.
app.post("/api/research", async (req, res) => {
  try {
    const { theme, apiKey, preferences } = req.body;
    const { geminiKey: serverGeminiKey } = getServerKeys();
    const effectiveApiKey = resolveEffectiveKey(serverGeminiKey, apiKey);
    if (!theme || !effectiveApiKey) {
      res.status(400).json({ error: 'theme and usable apiKey are required' });
      return;
    }

    // Use Gemini to generate research with grounded sources
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey: effectiveApiKey });

    const freshnessHint = preferences?.sourcePreference === 'recent-only'
      ? '2024年以降のデータのみ使用。古い情報は使わない。'
      : '可能な限り最新のデータを優先。';

    const prompt = `
あなたはリサーチアナリストです。以下のテーマについて、信頼できる数値データと出典を調査してください。

テーマ: ${theme}

### 出力ルール
- 実在する公開レポート・統計のみ引用する（捏造厳禁）
- 各数値主張に出典（レポート名、発行元、公開年）を明記する
- ${freshnessHint}
- 出典が見つからない場合は「定性的な傾向として」と明記する
- JSON形式で返す

### 出力形式
{
  "summary": "テーマの概要（2-3文）",
  "sources": [
    { "id": "src-1", "title": "レポート名", "url": "URL（不明なら空文字）", "publisher": "発行元", "publishedAt": "2024-01-01", "accessedAt": "${new Date().toISOString().split('T')[0]}" }
  ],
  "claims": [
    { "id": "claim-1", "text": "主張文", "metricValue": "数値", "metricUnit": "単位", "sourceId": "src-1", "publishedAt": "2024-01-01" }
  ],
  "warnings": ["注意事項があれば"]
}
`;

    const response = await ai.models.generateContent({
      model: RESEARCH_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.3,
      },
    });

    const text = response.text?.trim() || '{}';
    const packet = JSON.parse(text);

    // Ensure required fields
    res.json({
      summary: packet.summary || '',
      sources: packet.sources || [],
      claims: packet.claims || [],
      warnings: packet.warnings || [],
    });
  } catch (error: any) {
    console.error('Research endpoint error:', error.message);
    res.status(500).json({
      summary: '',
      sources: [],
      claims: [],
      warnings: [`リサーチ取得に失敗しました: ${error.message}`],
    });
  }
});

app.post("/api/generate-structure", async (req, res) => {
  try {
    const { interviewData, apiKey, researchPacket, answers, followUpAnswers } = req.body;
    const { geminiKey: serverGeminiKey } = getServerKeys();
    const effectiveApiKey = resolveEffectiveKey(serverGeminiKey, apiKey);

    if (!interviewData?.theme || !effectiveApiKey) {
      res.status(400).json({ error: 'interviewData.theme and usable apiKey are required' });
      return;
    }

    const { generateSlideStructure } = await import('./src/services/geminiService');
    const slides = await generateSlideStructure(
      interviewData,
      effectiveApiKey,
      researchPacket,
      answers,
      followUpAnswers,
    );
    res.json(slides);
  } catch (error: any) {
    console.error('Structure generation error:', error.message);
    res.status(500).json({ error: error.message || 'Failed to generate slide structure' });
  }
});

app.post("/api/generate-background", async (req, res) => {
  try {
    const { prompt, apiKey } = req.body;
    const { imageKey: serverImageKey } = getServerKeys();
    const effectiveApiKey = resolveEffectiveKey(serverImageKey, apiKey);

    if (!prompt || !effectiveApiKey) {
      res.status(400).json({ error: 'prompt and usable apiKey are required' });
      return;
    }

    const { generateBackgroundImage } = await import('./src/services/geminiService');
    const imageUrl = await generateBackgroundImage(prompt, effectiveApiKey);
    res.json({ imageUrl });
  } catch (error: any) {
    console.error('Background generation error:', error.message);
    res.status(500).json({ error: error.message || 'Failed to generate background image' });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static('dist'));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
