# Prompt Pack Contract

## フォルダ構造

```
prompts/infographic/
  master-system.md          -- LLMの役割定義、核心思想、品質基準
  shared-constraints.md     -- 全ページ共通の制約（文字数制限、KPI記法、JSON形式）
  page-kinds/
    cover.md                -- coverページ固有の指示
    executive-summary.md    -- executive-summaryページ固有の指示
    problem-analysis.md     -- problem-analysisページ固有の指示
    comparison.md           -- （未作成）comparisonページ固有の指示
    roadmap.md              -- （未作成）roadmapページ固有の指示
    deep-dive.md            -- （未作成）deep-diveページ固有の指示
    decision-cta.md         -- （未作成）decision-ctaページ固有の指示
```

## ファイル命名規則

- プロンプトファイルは全て `.md` 形式
- page-kinds/ 配下は pageKind 名と完全一致させる
- ファイル名にバージョン番号を含めない（git で管理する）

## バージョニングルール

- プロンプト変更は必ず独立したコミットとする
- コミットメッセージに `prompt:` プレフィックスを付与
  - 例: `prompt: strengthen headline-specificity guidance in cover.md`
- 破壊的変更（JSON構造の変更等）は `prompt-breaking:` プレフィックスを使用
- A/Bテスト用のバリアントは `prompts/infographic/variants/` に配置（将来対応）

## ファイルの役割分担

| ファイル | 責務 | 変更頻度 |
|---------|------|---------|
| master-system.md | LLMペルソナ、出力形式、核心思想 | 低（基盤変更時のみ） |
| shared-constraints.md | 文字数制限、KPI記法、JSON schema | 中（制限値調整時） |
| page-kinds/*.md | ページ種別固有の構造・内容ガイダンス | 高（品質改善の主戦場） |

## プロンプト組立順序

1. master-system.md（システムプロンプト）
2. shared-constraints.md（共通制約）
3. page-kinds/{pageKind}.md（該当ページの固有指示）
4. RichBrief（QA回答から構造化されたブリーフ）
5. テーマ・supplementContext（ユーザー入力）

## 現状の課題

- page-kinds/ が cover, executive-summary, problem-analysis の3ファイルのみ
- comparison, roadmap, deep-dive, decision-cta が未作成
- pipeline-core.ts の SlideSpec 生成パスがプロンプトパックを完全には活用していない
- answersContext がフラットな箇条書きのまま（RichBrief 未注入）
