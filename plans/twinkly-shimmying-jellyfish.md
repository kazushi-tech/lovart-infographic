# Plan: 根拠鮮度・履歴永続化・生成速度を先に立て直し、その上でウィザード品質を上げる

## Context

現行案の「アダプティブ質問」と「リッチな Brief」の方向性自体は悪くない。だが、この repo の現状ボトルネックは別にある。

- 数値の根拠は `sourceNote` という自由文字列に押し込まれているだけで、取得元・公開年・取得日時・どの主張に紐づくかが構造化されていない
- 生成済みスライド、編集中の要素、左カラムのメッセージは `AppShell` のメモリ state にしかなく、リロードや新規作成で消える
- 生成フローは「構成生成 -> 背景画像生成」の直列寄りで、特に背景画像が 1 枚ずつ処理されるため体感が重い

実装上も以下の制約が見えている。

- `src/services/geminiService.ts` はプロンプト内で「sourceNote を付ける」と指示しているだけで、外部根拠の取得や鮮度判定をしていない
- `src/components/AppShell.tsx` は `slides` / `messages` をコンポーネント state のみで持っている
- `src/components/AppShell.tsx` の背景画像生成は `for` ループ内で順番に `await` している
- `README.md` にも「編集結果の永続化: 現状はメモリ内のみ」と明記されている

したがって、**このまま現行案だけで進めるのは勧めない**。優先順位を組み替え、まず「信頼できる数値」「履歴が残る」「待ち時間が減る」を解決し、その上で adaptive wizard を載せる。

---

## Goal

1. 数値を含むスライドは、公開年と出典 URL をたどれる状態にする
2. 生成履歴と編集中データを、少なくとも同一ブラウザでは再訪できるようにする
3. 最初の編集可能プレビューを早く出し、背景画像は後追いで埋める
4. その土台の上で、テーマ適応型の質問とプロンプト改善を入れる

---

## Important Constraints

- この repo は standalone SPA + Express であり、現時点で DB はない
- 初回の履歴機能は **local-first** にする。まずは IndexedDB を正本にし、必要なら後でサーバー同期を足す
- fresh な根拠を取れない場合、AI に数値を捏造させない。数値を諦めて定性的表現に落とす
- `sourceNote` は最終表示用の派生文字列に留め、正本データは構造化された `SourceRef[]` / `EvidenceClaim[]` にする
- ページ種別の完全自由化は後回しにする。まずは 3 / 5 / 8 / 10 枚の骨格を維持し、内容品質と速度を安定させる

---

## Architecture Overview

```text
[Interview Answers]
theme / style / slideCount / audience / message / tone
          ↓
[Research Packet]
query normalization
→ source fetch / grounded research / user-provided sources
→ freshness filter
→ evidence claims extraction
          ↓
[Rich Brief]
answers + adaptive context + evidence summary
          ↓
[Slide Structure Generation]
semantic slides + source ids + warnings
          ↓
[Persist Deck Record]
brief / slides / edits / timings / messages
          ↓
[Render Editor Immediately]
CSS fallback background で先に開く
          ↓
[Async Background Queue]
cover or selected slides first
cache hit があれば再利用
```

---

## Milestone 0: 根拠モデルと鮮度ガード (Agent A)

**目的**: 「出典っぽい文字列」ではなく、数値主張に追跡可能な根拠を持たせる。

### 変更ファイル

| File | Action | Description |
|------|--------|-------------|
| `src/demoData.ts` | Modify | `SlideData` に `sources`, `evidenceRefs`, `warnings` などを追加 |
| `src/interview/schema.ts` | Modify | Brief に `evidenceMode`, `sourcePreference` などの余地を追加 |
| `src/services/researchClient.ts` | **New** | クライアントから研究結果を取得する薄い API client |
| `src/services/sourceFreshness.ts` | **New** | 公開日・取得日・鮮度閾値の判定 |
| `server.ts` | Modify | `/api/research` エンドポイント追加。外部取得はサーバー側へ寄せる |
| `src/services/geminiService.ts` | Modify | `ResearchPacket` を受け取り、数値主張を evidence ベースに限定 |

### 型の方向性

```typescript
export interface SourceRef {
  id: string;
  title: string;
  url: string;
  publisher?: string;
  publishedAt?: string; // ISO date
  accessedAt: string;   // ISO date
}

export interface EvidenceClaim {
  id: string;
  text: string;
  metricValue?: string;
  metricUnit?: string;
  sourceId: string;
  publishedAt?: string;
}

export interface ResearchPacket {
  summary: string;
  sources: SourceRef[];
  claims: EvidenceClaim[];
  warnings: string[];
}
```

### ルール

- 数値を含む KPI / fact / comparison row は、必ず `EvidenceClaim` に紐づける
- 公開年が古い、または不明な場合は warning を付ける
- **偽の精密化を禁止**する。`50%` を勝手に `47.3%` に変えるようなことはしない
- evidence が不足する場合は、定性的メッセージへフォールバックする
- `sourceNote` は `SourceRef[]` から UI 用に組み立てる派生値とする

### 鮮度ポリシー

- AI / SaaS / 市場規模のような変化が速いテーマは、既定で 24 か月以内を「fresh」とみなす
- テーマに応じて閾値は調整可能にする
- fresh でない数値を表示する場合は「参考値」「要再確認」の warning を明示する

---

## Milestone 1: 履歴と編集中データの永続化 (Agent B)

**目的**: 生成履歴が残らず作業が消える問題を解消する。

### 変更ファイル

| File | Action | Description |
|------|--------|-------------|
| `src/history/schema.ts` | **New** | `DeckRecord`, `DeckSummary`, `GenerationTiming` 型定義 |
| `src/history/indexedDb.ts` | **New** | IndexedDB ラッパ |
| `src/hooks/useDeckHistory.ts` | **New** | 履歴の一覧取得、保存、復元、削除 |
| `src/components/AppShell.tsx` | Modify | 生成完了時保存、編集時 debounce 保存、履歴から復元 |
| `src/components/AppHeader.tsx` | Modify | 「最近の履歴」導線を追加 |
| `src/components/ChatInterviewSidebar.tsx` | Modify | 現在の deck summary と再オープン導線を表示 |
| `README.md` | Modify | local-first history の仕様を追記 |

### 保存単位

```typescript
export interface DeckRecord {
  id: string;
  briefDraft: BriefDraft;
  slides: SlideData[];
  messages: ChatMessage[];
  timings: GenerationTiming;
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'generated' | 'failed';
}
```

### 保存方針

- 生成開始時に draft を作る
- 構成生成完了時に 1 回保存する
- 要素編集は 500ms 程度の debounce で自動保存する
- `handleNew` は「画面を空にする」だけで、過去 deck は消さない
- 履歴一覧ではテーマ、更新時刻、枚数、warning の有無を表示する

### スコープ

- まずは同一ブラウザ内での復元に限定する
- マルチデバイス共有やチーム共有は次段階で検討する

---

## Milestone 2: 生成速度の改善と非同期背景キュー (Agent C)

**目的**: 体感速度を改善し、追加 AI 呼び出しが UX を悪化させないようにする。

### 変更ファイル

| File | Action | Description |
|------|--------|-------------|
| `src/components/AppShell.tsx` | Modify | 生成フローを段階化し、編集画面を先に開く |
| `src/services/geminiService.ts` | Modify | 生成 timing 計測、軽量生成ルート、abort 対応 |
| `src/services/backgroundQueue.ts` | **New** | 背景画像の並列数制御と進捗管理 |
| `src/services/promptCache.ts` | **New** | brief hash / bgPrompt hash 単位のキャッシュ |
| `src/designTokens.ts` | Modify | `backgroundMode: 'none' | 'cover-only' | 'all'` を追加 |

### 実装方針

1. スライド構成が返った時点で editor を開く  
   背景画像が未生成でも CSS fallback で閲覧・編集可能にする

2. 背景画像は後段キューへ移す  
   `for` で 1 枚ずつ待つのではなく、最大 2 件程度の並列数で `Promise.allSettled` 相当の制御を行う

3. 背景生成対象を絞る  
   初期値は `cover-only` を検討し、全ページ背景は opt-in にする

4. 同一 prompt の再生成を避ける  
   `theme + style + pageKind + bgPrompt` を hash 化してキャッシュする

5. timing を保存する  
   `researchMs`, `structureMs`, `backgroundMs`, `totalMs` を `DeckRecord` に持たせる

### 受け入れ基準

- 構成生成完了後、背景未完了でも editor が操作可能
- 5枚デッキで「最初の編集可能表示」までの時間が現状より明確に短くなる
- 同じ brief を再生成した際、adaptive options / background cache が効く

---

## Milestone 3: アダプティブ質問生成サービス (Agent D)

**目的**: テーマ依存の薄い固定質問を改善する。ただし、Milestone 0-2 の後に着手する。

### 変更ファイル

| File | Action | Description |
|------|--------|-------------|
| `src/interview/schema.ts` | Modify | `AdaptiveFieldId`, `AdaptiveOptionsResult`, `adaptiveBriefContext` を追加 |
| `src/services/adaptiveInterviewService.ts` | **New** | テーマ・スタイル・枚数に応じた動的選択肢生成 |
| `src/hooks/useAdaptiveOptions.ts` | **New** | 生成状態・キャッシュ管理 |
| `src/components/AppShell.tsx` | Modify | slideCount 回答後に prefetch |
| `src/components/assistant/AssistantShell.tsx` | Modify | adaptive options の合成 |
| `src/components/assistant/WizardStepDialog.tsx` | Modify | loading skeleton と fallback UI |

### 設計詳細

- adaptive options の cache key は `theme + styleId + slideCount` を正規化した hash にする
- 取得失敗時は静的選択肢へフォールバックする
- 追加 AI 呼び出しは review 遷移前に待たない。prefetch と cache を前提にする
- 将来的に `evidenceMode` や「自社データを使うか」を adaptive step として足せる余地を残す

---

## Milestone 4: Rich Brief と safer prompt 設計 (Agent E)

**目的**: 回答の羅列ではなく、evidence 付きの豊かな brief を作る。

### 変更ファイル

| File | Action | Description |
|------|--------|-------------|
| `src/interview/brief.ts` | Modify | `buildRichBrief()` を追加 |
| `src/interview/schema.ts` | Modify | `StepOption` に `promptHint?: string` を追加 |
| `src/services/geminiService.ts` | Modify | prompt を evidence aware に再設計 |
| `src/services/promptTemplates.ts` | **New** | 品質制約、アンチパターン、pageKind 別テンプレート |

### prompt ルール

- 数値主張は `ResearchPacket.claims` のみから使う
- 数値の表記は source の精度を維持し、勝手に桁を増やさない
- 各 slide は `sourceIds` または `evidenceRefs` を返す
- 根拠がない場合、定性的表現へ切り替える
- `3 / 5 / 8 / 10` 枚の pageKind 骨格は当面維持する

### ページ構成の扱い

- 現段階では「固定シーケンス完全廃止」はしない
- 代わりに、骨格ごとに「差し替え可能 slot」を限定し、破綻しない範囲で柔軟化する
- 例: 5枚なら `cover -> executive-summary -> problem-analysis -> comparison|deep-dive -> decision-cta`

---

## Milestone 5: 品質バリデーションと warning 表示 (Agent E)

**目的**: 出典・鮮度・内容の質を機械的に落とさない。

### 変更ファイル

| File | Action | Description |
|------|--------|-------------|
| `src/services/contentValidator.ts` | **New** | 見出し、重複、数値根拠、warning 判定 |
| `src/services/sourceFreshness.ts` | Modify | content validator から利用 |
| `src/services/geminiService.ts` | Modify | 1 回だけ再試行可能な validation loop |
| `src/components/RightInspectorPanel.tsx` | Modify | slide warning を表示 |
| `src/components/CenterPreviewWorkspace.tsx` | Modify | source badge / warning badge を表示 |

### バリデーションルール

1. headline に `〜について`, `概要`, `まとめ` などの汎用語がないか
2. 数値を含む KPI / fact / comparison row に `evidenceRefs` が付いているか
3. 紐づく source の公開年があり、鮮度閾値を超える場合は warning になるか
4. 同一 headline や同一数値の重複が過多でないか
5. source URL が空文字や不正形式でないか

### リトライ戦略

- 1回目で validation failure なら、失敗理由を短く注入して 1 回だけ再生成する
- 2回目も失敗したら warning 付きで返し、editor 上で修正可能にする
- 鮮度不足は隠蔽せず warning として残す

---

## Milestone 6: Style-Aware レイアウトバリアント (Agent F)

**目的**: スタイル選択を色だけで終わらせず、構図にも反映する。

### 変更ファイル

| File | Action | Description |
|------|--------|-------------|
| `src/designTokens.ts` | Modify | `layoutVariant` と `backgroundMode` を保持 |
| `src/slides/layoutTemplates.ts` | Modify | `getLayoutTemplate(pageKind, variant)` 化 |
| `src/slides/layoutCompiler.ts` | Modify | token から variant を受けて template 解決 |

### 初期スコープ

- `cover` と `executive-summary` で variant 差分を作る
- 他 pageKind は段階的に増やす
- `modern` / `minimal` は centered、`corporate` / `professional` は standard、`executive` は将来 asymmetric 余地を残す

---

## Implementation Strategy

### Phase 0: 現状計測と安全確保

1. 作業ツリー確認
2. 大きい変更に入る前に安全用コミット
3. 現行の `structureMs` / `backgroundMs` を計測し、改善前ベースラインを残す

### Phase 1: 信頼性の土台

- Milestone 0: 根拠モデル
- Milestone 1: 履歴永続化

### Phase 2: 体感速度の改善

- Milestone 2: 非同期背景キュー

### Phase 3: 入力品質の改善

- Milestone 3: adaptive options
- Milestone 4: rich brief + prompt redesign

### Phase 4: 出力品質の仕上げ

- Milestone 5: validation + warning
- Milestone 6: layout variants

### 実装順の判断基準

- ユーザー体感の痛みが強いものから先に解く
- AI 呼び出し数を増やす施策は、必ず cache と latency budget をセットにする
- source freshness を保証できない数値演出は採用しない

---

## Verification

### 自動チェック

```bash
npm run lint
npm run build
```

### 手動確認

1. AI 関連テーマで生成した deck に、各数値主張の source year と URL が出るか
2. source が古い場合、スライド上または inspector 上に warning が出るか
3. 生成後にリロードしても、deck を履歴から再オープンできるか
4. 要素を編集してリロードしても、編集内容が残るか
5. 5枚 deck で、背景未生成でも editor が先に開くか
6. 同じテーマで再生成した際、adaptive options と background cache が効くか
7. source が十分でないテーマでは、捏造数値ではなく定性的表現に落ちるか
8. Modern スタイルで cover が centered variant になるか

### 計測項目

- `researchMs`
- `structureMs`
- `backgroundMs`
- `totalMs`
- cache hit rate
- warning 付き slide の件数

---

## Critical Files Reference

| File | Role |
|------|------|
| `src/services/geminiService.ts` | スライド生成の核。現状の sourceNote 指示、構成生成、背景生成が集約されている |
| `src/components/AppShell.tsx` | 画面遷移、生成開始、slides/messages state、背景画像逐次生成の中心 |
| `src/interview/schema.ts` | InterviewStep, BriefDraft, StepOption の定義 |
| `src/interview/state.ts` | reducer と `buildBriefDraft()` |
| `src/interview/brief.ts` | brief summary と将来の rich brief 構築ポイント |
| `src/demoData.ts` | `SlideData` 型の正本。source/evidence/history 対応の起点 |
| `src/history/indexedDb.ts` | 永続化の正本ストレージ |
| `src/hooks/useDeckHistory.ts` | 履歴の取得・保存・復元 |
| `src/services/researchClient.ts` | 根拠取得の client adapter |
| `src/services/sourceFreshness.ts` | 出典鮮度の判定 |
| `src/services/backgroundQueue.ts` | 背景生成の非同期処理 |
| `src/slides/layoutTemplates.ts` | レイアウトスロット定義 |
| `src/slides/layoutCompiler.ts` | セマンティックデータを描画要素に変換 |

---

## Decision

この順で進める。

- 先に adaptive wizard だけを実装するのは見送る
- まず「古い数値でもそれっぽく見えてしまう」問題を止血する
- 次に「履歴が消える」「遅い」を潰す
- その後で、質問品質とレイアウト品質を上げる
