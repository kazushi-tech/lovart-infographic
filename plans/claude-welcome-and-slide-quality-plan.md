# Claude実装プラン: Welcome遷移修正 + スライド品質改善

## Goal

以下を、同じブランチで段階的に実装する。

1. Welcome画面の「要件を入力する」ボタンが最初の質問に進まない不具合を修正する
2. 生成されるインフォグラフィックスライドの情報設計と見た目の品質を、現在の実装制約の中で一段引き上げる

## Important Constraints

- このrepoは「構造化JSONを生成して React canvas 上で描画する」方式であり、参照repoのような「Marp -> スライド画像生成」方式ではない
- よって、参照repoのワークフローを丸ごと移植しない
- 代わりに、参照repoからは「テンプレート化された情報設計ルール」「レイアウト制約」「スライドごとのプロンプト分離」の発想だけを取り込む
- 大きめの変更に入る前に、現状の作業ツリーを確認し、必要なら安全用コミットを作る

## 参照repoから取り込む内容

参照元:
- https://github.com/KeigoMatsumaru/ai-channnel-infographic-test
- `template/main-template-fixed-header.yaml`
- `scripts/marp_to_prompts.js`

取り込むもの:
- 情報設計の原則
  - 視線誘導
  - 因果関係や順序の可視化
  - 視覚的階層
  - コンテナ、矢印、フロー型レイアウトの明示
- スライド単位でプロンプトを明確に分ける考え方
  - 今回は Marp 変換ではなく、`pageKind` ごとの layout brief として実装する
- レイアウトを AI の気分に完全依存させず、テンプレートで縛る考え方

取り込まないもの:
- 黒猫やワイン等の固有モチーフ
- 画像一枚にすべてを描き込む前提の生成フロー
- `.agent` ワークフロー依存

## Phase 1: Welcome遷移バグ修正

### Root Cause

現状は Welcome 判定が派生条件になっており、初期 state から `handleStartInterview` を呼んでも state が変化しないため、再び Welcome が描画される。

### 方針

`started` フラグは追加しない。すでに存在する `phase: 'idle' | 'collecting' | 'review'` のうち未使用の `idle` を Welcome 状態として使う。

### 変更対象

- `src/interview/state.ts`
- `src/components/assistant/AssistantShell.tsx`
- `src/components/AppShell.tsx`

### 実装内容

1. `src/interview/state.ts`
   - 初期 state を `phase: 'idle'` に変更
   - `WizardAction` に `{ type: 'startInterview' }` を追加
   - reducer に `startInterview` を追加し、`phase: 'collecting'`, `activeStepIndex: 0` を保証
   - `reset` は `idle` に戻す
   - `goToStep`, `back`, `answer` は既存どおり `collecting` / `review` を使う

2. `src/components/assistant/AssistantShell.tsx`
   - `isWelcome` を `phase === 'idle'` に変更
   - Welcome 非表示条件を `idle` 基準に単純化

3. `src/components/AppShell.tsx`
   - `handleStartInterview` は `dispatch({ type: 'startInterview' })` を必ず呼ぶ
   - `handleNew` は `reset` により Welcome に戻る
   - `handleSample` は現状どおり review へ遷移してよい

### 完了条件

- 初期表示で Welcome が出る
- 「要件を入力する」で最初の質問へ進む
- 「サンプルで試す」で review に進む
- 「新規作成」で Welcome に戻る

## Phase 2: スライド品質改善の設計整理

### 現状のボトルネック

- `src/demoData.ts` の `ElementData.type` が `text | kpi | card` しかなく、表現力が低い
- `src/components/CenterPreviewWorkspace.tsx` 側の描画も上記3種類に固定されている
- `src/services/geminiService.ts` は AI に絶対座標つき `elements` を直接吐かせており、品質が安定しない
- 背景画像が抽象寄りで、情報レイアウト自体の品質向上にあまり寄与していない

### 方針

「AIに全部レイアウトさせる」のをやめ、以下の2段構成に寄せる。

1. AIにはスライドの意味構造とレイアウト種別を返させる
2. 具体的な座標と表示要素は、アプリ側の deterministic な layout compiler で組み立てる

## Phase 3: レイアウトテンプレート導入

### 新規追加候補

- `src/slides/layoutTemplates.ts`
- `src/slides/layoutCompiler.ts`
- `src/slides/layoutRules.ts`

### 実装内容

1. `pageKind` ごとに layout template を定義する
   - `cover`
   - `executive-summary`
   - `problem-analysis`
   - `comparison`
   - `roadmap`
   - `deep-dive`
   - `decision-cta`

2. 各 template に以下を持たせる
   - headline area
   - subheadline area
   - KPI slots
   - facts/list slots
   - sections container
   - comparison table area
   - roadmap lane
   - action item chips
   - source note slot

3. 参照repoの YAML を参考に、以下のルールを code 化する
   - 重要度に応じた文字サイズ階層
   - 左 -> 右 / 上 -> 下 の視線誘導
   - 関係がある要素は近くに置く
   - 要素の詰め込みを避ける
   - 余白とグリッドを優先する

### 完了条件

- AI 出力が多少荒くても、各 `pageKind` がそれらしいレイアウトになる
- スライド間の見た目のバラつきが減る

## Phase 4: 生成スキーマを semantic-first に変更

### 変更対象

- `src/services/geminiService.ts`
- `src/demoData.ts`

### 実装内容

1. AI に返させる内容を見直す
   - `pageKind`
   - `eyebrow`
   - `headline`
   - `subheadline`
   - `facts`
   - `kpis`
   - `sections`
   - `comparisonRows`
   - `roadmapPhases`
   - `actionItems`
   - `takeaways`
   - `sourceNote`
   - `layoutStyle` または `flowPattern`

2. `elements` を AI 必須項目から外す、または optional に落とす
   - 初回実装ではアプリ側で `compileSlideElements(slide, token)` を通して生成する
   - AI が `elements` を返しても fallback 扱いにする

3. プロンプトを pageKind ごとの brief に分解する
   - 参照repoの `marp_to_prompts.js` の発想を使い、「スライドごとに要求を明確化」する
   - ただし markdown ファイルは作らず、文字列テンプレートとして `geminiService.ts` 内または別ファイルに持つ

4. prompt に追加する制約
   - 各スライドの主張は1つに絞る
   - KPI は最大2件
   - facts は2-3件まで
   - comparison は3行固定
   - roadmap は3 phase 固定
   - 1スライドあたり文字量上限を設ける
   - sourceNote を必要スライドにだけ付与する

### 完了条件

- 生成結果が「意味的には豊か、構造的には安定」になる
- 座標崩れによる読みにくさが大きく減る

## Phase 5: Renderable要素の拡張

### 変更対象

- `src/demoData.ts`
- `src/components/CenterPreviewWorkspace.tsx`
- 必要なら `src/components/RightInspectorPanel.tsx`

### 実装内容

`ElementData.type` を増やし、少なくとも以下を描画できるようにする。

- `text`
- `kpi`
- `card`
- `badge`
- `divider`
- `bullet-list`
- `comparison-row`
- `roadmap-step`
- `chip`

必要に応じて、`variant`, `background`, `borderColor`, `radius`, `padding`, `icon`, `zIndex` などの style props を追加する。

### 描画方針

- `kpi` は今の青固定をやめ、`designToken` に従う
- `card` は pageKind / style ごとに余白と背景を分ける
- `comparison-row` は左右比較が視認しやすい2列構造にする
- `roadmap-step` は横並びタイムラインか縦ステップを選べるようにする

### 完了条件

- テキストの羅列ではなく、インフォグラフィックらしい構造が見える
- `comparison` と `roadmap` が専用レイアウトで出る

## Phase 6: 背景と装飾の改善

### 方針

背景画像は主役ではなく補助に下げる。情報可読性を優先する。

### 実装内容

1. style ごとに背景戦略を分ける
   - `corporate`, `professional`, `minimal` は CSS グラデーションや図形ベースを優先
   - `executive`, `modern` のみ AI 背景画像を使ってもよい

2. `designTokens.ts` を拡張する
   - card background
   - border color
   - muted text
   - surface tint
   - decorative accent

3. 背景画像生成 prompt を pageKind に応じて変える
   - cover: hero / abstract strategic visual
   - problem-analysis: subtle analytical texture
   - comparison: restrained neutral background
   - roadmap: forward-looking directional visual

4. 画像生成失敗時の fallback を改善する
   - 空画像ではなく CSS 背景だけで成立させる

### 完了条件

- 文字可読性が上がる
- 背景がスライド内容を邪魔しない

## Phase 7: Layout後処理と安全策

### 実装内容

- 要素座標の clamp
- 最小フォントサイズの保証
- 幅の自動補正
- 画面端へのはみ出し防止
- headline と body の重なり防止
- slot 数を超えたデータの切り捨て / 要約 fallback

必要なら `normalizeSlideData` または `sanitizeCompiledElements` を追加する。

### 完了条件

- AI 出力が少し崩れても表示破綻しにくい

## 推奨実装順

1. Phase 1 のみ先に実装して lint/build を通す
2. その後、Phase 3 + 4 をまとめて入れる
3. 続けて Phase 5 を入れて描画器を拡張する
4. 最後に Phase 6 + 7 で見た目と安定性を整える

## 検証

### 自動検証

- `npm run lint`
- `npm run build`

### 手動検証

1. Welcome 画面から質問開始できる
2. サンプルロードが壊れていない
3. 3枚 / 5枚 / 8枚 / 10枚で生成が成立する
4. `comparison` スライドが比較表として読める
5. `roadmap` スライドが時系列として読める
6. 背景画像がなくてもスライドが成立する
7. 生成後、要素ドラッグ編集が壊れていない

## Claudeへの実装指示

- まず Phase 1 を小さく確定させる
- 次に「semantic data -> layout compiler -> render elements」の流れに寄せる
- 参照repoは設計原則の流用に留め、Marp や `.agent` 依存を持ち込まない
- 1回で全部やるより、少なくとも 2 コミット以上に分ける
- 既存の未コミット変更は巻き戻さない
