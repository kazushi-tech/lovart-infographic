# Rich Brief Schema

## RichBrief インターフェース定義

定義場所: `lib/prompt-brief-builder.ts`

```typescript
interface RichBrief {
  businessObjective: string;
  targetAudience: string;
  decisionContext: string;
  desiredDeckTone: string;
  evidenceExpectations: string;
  pageBlueprint: string;
  forbiddenMoves: string[];
  visualPriority: string;
  textSafetyBudgets: TextSafetyBudgets;
  supplementContext?: string;
}

interface TextSafetyBudgets {
  headlineMaxChars: number;   // default: 20
  factMaxChars: number;       // default: 14
  kpiValueMaxChars: number;   // default: 12
  kpiUnitMaxChars: number;    // default: 8
  eyebrowMaxChars: number;    // default: 14
}
```

## 各フィールドの意図

| フィールド | 意図 | 例 |
|-----------|------|-----|
| businessObjective | LLMにテーマと目的を明示 | 「中堅企業のERP刷新について役員説明・意思決定用の資料を作成する」 |
| targetAudience | 読者レベルに合わせた語彙・詳細度を制御 | 「経営層・役員。短時間で結論と根拠を把握したい」 |
| decisionContext | ページ構成の背景・ストーリーライン | 「表紙 → 要約（結論先出し）→ 比較分析 → 提言・次のアクション」 |
| desiredDeckTone | 文体・表現スタイル | 「フォーマル・公式。敬語を使い、品格のある表現」 |
| evidenceExpectations | 情報密度の期待値 | 「バランス型。概要と要点を組み合わせ、適度な深さで説明」 |
| pageBlueprint | ページ種別の順序を明示 | 「1. 表紙（cover）\n2. エグゼクティブサマリー（executive-summary）...」 |
| forbiddenMoves | LLMが避けるべきパターン | 見出しに20文字以上を詰め込まない、等 |
| visualPriority | 視覚的に最も目立たせる要素 | 「KPI数字とヘッドラインが視覚の主役」 |
| textSafetyBudgets | compositor が安全にレンダリングできる文字数 | headline 20, fact 14, etc. |
| supplementContext | 自由記述テキスト（あれば） | ユーザーが追加入力した補足情報 |

## QA回答 -> RichBrief の解決ロジック

`buildRichBrief(theme, answers, imageCount, intentId?)` が以下の順で解決する:

1. intent: answers から `intent_*` prefix を検索、なければ引数の intentId、最終フォールバックは `intent_executive`
2. audience: answers から `audience_*` prefix を検索、デフォルト `audience_exec`
3. tone: answers から `tone_*` prefix を検索、デフォルト `tone_formal`
4. detail: answers から `detail_*` prefix を検索、デフォルト `detail_balanced`
5. pageBlueprint: `getPageKindSequenceForIntent(intentId, imageCount)` で生成
6. forbiddenMoves: COMMON_FORBIDDEN_MOVES + INTENT_FORBIDDEN_EXTRAS[intentId]
7. supplementContext: selectedOptionId がない自由記述回答を連結

## renderRichBriefAsPrompt 出力形式

マークダウンセクション形式でLLMプロンプトに注入可能な文字列を生成する。
セクション: ビジネス目的 / 対象読者 / 意思決定の文脈 / トーン / エビデンスの期待 /
ページ構成 / 禁止事項 / ビジュアル優先度 / テキスト安全予算 / 補足コンテキスト
