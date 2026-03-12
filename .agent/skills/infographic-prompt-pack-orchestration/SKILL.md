# Infographic Prompt Pack Orchestration

## Purpose

インフォグラフィック生成用のバージョン管理されたプロンプトアセットを管理し、
RichBrief 構築 -> プロンプト組立 -> 批評 -> 修正のワークフローを実行する。

## When to Use

- "prompt pack", "prompt改善", "prompt version", "prompt orchestration"
- プロンプトの品質改善・バージョン管理を行うとき
- SlideSpec 生成結果の品質が低いとき
- 新しいページ種別やintentに対応するプロンプトを追加するとき

## Key Files

- `prompts/infographic/**` -- プロンプトパック（master-system, shared-constraints, page-kinds/）
- `lib/prompt-brief-builder.ts` -- RichBrief 構築（buildRichBrief, renderRichBriefAsPrompt）
- `lib/pipeline-core.ts` -- プロンプト組立・LLM呼び出し（buildPromptsFromQA, buildHybridPrompts）
- `lib/content-quality-gate.ts` -- presentability warnings
- `lib/slide-compositor.ts` -- SlideSpec -> SVG レンダリング

## Core Workflow

1. **Inspect prompt pack**: prompts/infographic/ の現在のファイル構成とバージョンを確認
2. **Build rich brief**: QA回答からRichBriefを構築し、intent/audience/tone/detailを構造化
3. **Assemble prompt**: プロンプトパックのテンプレート + RichBrief でLLM用プロンプトを組立
4. **Critique**: 生成されたSlideSpecを8次元の批評軸で評価
5. **Repair**: critical/majorの検出時、修正指示を付与して再生成

## References

- `references/prompt-pack-contract.md` -- フォルダ構造・命名規則・バージョニングルール
- `references/rich-brief-schema.md` -- RichBrief インターフェース仕様
- `references/critique-rubric.md` -- 8次元批評基準と修正トリガー
- `references/file-map.md` -- ファイル責務マッピング

## Integration

- brief-truth-audit: プロンプト改善前後のtruth差分を記録
- guided-intent-wiring: intent -> RichBrief -> prompt の接続
- business-slide-review-gate: 生成結果の品質ゲート
