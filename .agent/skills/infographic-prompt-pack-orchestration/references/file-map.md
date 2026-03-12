# File Map

## プロンプト関連ファイル

| ファイル | 責務 |
|---------|------|
| `prompts/infographic/master-system.md` | LLMの役割定義、核心思想、品質基準 |
| `prompts/infographic/shared-constraints.md` | 文字数制限、KPI記法、JSON schema定義 |
| `prompts/infographic/page-kinds/cover.md` | coverページ固有のプロンプト指示 |
| `prompts/infographic/page-kinds/executive-summary.md` | executive-summaryページ固有の指示 |
| `prompts/infographic/page-kinds/problem-analysis.md` | problem-analysisページ固有の指示 |

## RichBrief 構築

| ファイル | 責務 |
|---------|------|
| `lib/prompt-brief-builder.ts` | RichBrief構築 (buildRichBrief) とプロンプト文字列化 (renderRichBriefAsPrompt) |
| `lib/guided-brief-options.ts` | intent/audience/tone/detailのオプション定義、ページ種別シーケンス生成 |

## プロンプト組立・LLM呼び出し

| ファイル | 責務 |
|---------|------|
| `lib/pipeline-core.ts` | buildPromptsFromQA, buildHybridPrompts, buildSlideSpecPrompt, buildBackgroundPromptsPrompt |
| `lib/pipeline-core-types.ts` | SlideSpec, PageKind, SlidePrompt 等の型定義 |

## 品質ゲート・レンダリング

| ファイル | 責務 |
|---------|------|
| `lib/content-quality-gate.ts` | presentability warnings の判定 |
| `lib/slide-compositor.ts` | SlideSpec -> SVG レンダリング、文字数clamp処理 |

## 設定

| ファイル | 責務 |
|---------|------|
| `config/pipeline.json` | temperature, maxTokens, モデル名等のパイプライン設定 |

## データフロー

```
QA回答
  |
  v
buildRichBrief() -- lib/prompt-brief-builder.ts
  |
  v
renderRichBriefAsPrompt() -- lib/prompt-brief-builder.ts
  |
  v
buildSlideSpecPrompt() -- lib/pipeline-core.ts
  + master-system.md
  + shared-constraints.md
  + page-kinds/*.md
  |
  v
Gemini API (SlideSpec JSON生成)
  |
  v
content-quality-gate.ts (presentability warnings)
  |
  v
slide-compositor.ts (SVG rendering)
```

## 背景画像プロンプト関連

### プロンプトアセット

| ファイル | 責務 |
|---------|------|
| `prompts/backgrounds/nano-banana2/VERSION.json` | パックバージョンメタデータ |
| `prompts/backgrounds/nano-banana2/master-system.md` | アートディレクターシステムプロンプト |
| `prompts/backgrounds/nano-banana2/shared-constraints.md` | テキスト禁止、セーフゾーン、ノイズ規則 |
| `prompts/backgrounds/nano-banana2/page-kinds/*.md` | ページ種別ごとの背景アートディレクション（7ファイル） |
| `prompts/backgrounds/nano-banana2/style-families/*.md` | スタイルプリセット（3ファイル） |
| `prompts/backgrounds/nano-banana2/motifs/*.md` | 再利用可能なビジュアルモチーフライブラリ |

### ランタイムコード

| ファイル | 責務 |
|---------|------|
| `lib/background-visual-brief-builder.ts` | RichBrief + SlideSpec から VisualBrief を構築 |
| `lib/background-prompt-pack-loader.ts` | プロンプトパックファイルの読み込みと選択 |
| `lib/background-prompt-runtime.ts` | プロンプト組み立て、8次元批評、修復ループ |
| `lib/background-image-validator.ts` | 生成後のセーフゾーン検証（エッジ密度） |

## 注意事項

- 現在 pipeline-core.ts は answersContext（フラット箇条書き）を使用しており、
  RichBrief が SlideSpec 生成パスに完全注入されていない
- page-kinds/ は3ファイルのみ存在（comparison, roadmap, deep-dive, decision-cta は未作成）
