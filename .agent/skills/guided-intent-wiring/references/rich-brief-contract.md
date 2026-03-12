# Rich Brief Contract

## RichBrief インターフェース

`lib/prompt-brief-builder.ts` で定義。QA回答を構造化されたブリーフに変換する。

```typescript
interface RichBrief {
  businessObjective: string;   // 「{theme}について{intent}用の資料を作成する」
  targetAudience: string;      // audience_* オプションから解決
  decisionContext: string;     // intent の expectedOutput
  desiredDeckTone: string;     // tone_* オプションから解決
  evidenceExpectations: string;// detail_* オプションから解決
  pageBlueprint: string;       // intent + imageCount から生成されたページ構成
  forbiddenMoves: string[];    // 共通禁止事項 + intent固有の禁止事項
  visualPriority: string;      // intent別の視覚優先度
  textSafetyBudgets: TextSafetyBudgets; // 文字数制限
  supplementContext?: string;  // 自由記述回答があれば追加
}
```

## QA回答から RichBrief フィールドへのマッピング

| QA回答のprefix | RichBrief フィールド | 解決ロジック |
|---------------|---------------------|-------------|
| intent_* | businessObjective, decisionContext, pageBlueprint, visualPriority, forbiddenMoves | getIntentOption + getPageKindSequenceForIntent |
| audience_* | targetAudience | AUDIENCE_DESCRIPTIONS ルックアップ |
| tone_* | desiredDeckTone | TONE_DESCRIPTIONS ルックアップ |
| detail_* | evidenceExpectations | DETAIL_DESCRIPTIONS ルックアップ |
| (自由記述) | supplementContext | text フィールドを連結 |

## Intent オプション一覧

| ID | ラベル | ページ構成 | ビジュアル優先度 |
|----|-------|-----------|-----------------|
| intent_executive | 役員説明・意思決定 | cover, exec-summary, comparison, comparison, decision-cta | KPI数字とヘッドライン |
| intent_proposal | 提案・企画書 | cover, problem-analysis, comparison, roadmap, decision-cta | 課題と解決策の対比 |
| intent_comparison | 比較検討・技術選定 | cover, comparison x3, decision-cta | 比較表と選定基準 |
| intent_plan | 実行計画・ロードマップ | cover, problem-analysis, roadmap x2, decision-cta | ロードマップとタイムライン |
| intent_report | 報告・レポート | cover, exec-summary, deep-dive x2 | 実績KPIとトレンドデータ |

## Audience オプション

| ID | 説明 |
|----|------|
| audience_exec | 経営層・役員。短時間で結論と根拠を把握したい |
| audience_manager | マネージャー・管理職。実行可能性と具体的な計画に関心が高い |
| audience_practitioner | 担当者・実務者。技術的な詳細と実装手順を求める |
| audience_client | クライアント・顧客。ビジネス価値と投資対効果を重視 |
| audience_general | 一般・幅広い層。専門用語を避け、わかりやすさを優先 |

## Tone オプション

| ID | 説明 |
|----|------|
| tone_formal | フォーマル・公式 |
| tone_casual | カジュアル・親しみやすい |
| tone_data | データ重視・分析的 |
| tone_story | ストーリー重視・説得的 |

## 実装ファイル

- `lib/prompt-brief-builder.ts` -- buildRichBrief / renderRichBriefAsPrompt
- `lib/guided-brief-options.ts` -- オプション定義、getIntentOption、getPageKindSequenceForIntent
- `lib/pipeline-core.ts` -- buildPromptsFromQA（現在は answersContext のみ使用）
