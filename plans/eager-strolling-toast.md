# Plan: インタビューフロー安定化 + 3カラム編集UI + Chrome DevTools 検証

## 判定

この方向で進めてよい。ただし、元プランのままだと次が漏れるため補正する。

1. `getCurrentQuestion` の利用をやめるだけでは、壊れた helper 自体が残る
2. `InterviewProgress` と `handleStepClick` の step index が噛み合っておらず、戻る操作が壊れている
3. インタビュー画面の問題は「中央寄せ不足」より「横幅不足」が本質
4. `external-infographic-image` は質問分岐だけ直しても、生成経路がまだスライド専用寄りで整合していない

---

## Milestone 0: ベースライン確保（Safety）

大きめの UI リファクタ前に、まず現状を固定する。

- P2 着手前に checkpoint commit を作成する
- 実装前の `npm run lint` と `npm run build` の結果を記録する
- 既存エラーがある場合は「今回の変更起因」と混ざらないようメモを残す

---

## Milestone 1: インタビューフロー修正（P0 Critical）

### 1-A: `questionBank.ts` の `shouldAsk()` 型ミスマッチ修正

`answers.outputTarget` は文字列で保持されているため、`BriefAnswer.value` 前提の参照をやめる。

- 修正前: `(answers.outputTarget as BriefAnswer | undefined)?.value === 'lovart-slides'`
- 修正後: `answers.outputTarget === 'lovart-slides'`

同様に `external-infographic-image` 側の 5 箇所も修正する。

対象ファイル:
- `src/brief/questionBank.ts`

### 1-B: `AppShell.tsx` の `handleSendMessage` を pending question 基準に修正

回答対象は `getCurrentQuestion(flowState)` ではなく、常に `getNextQuestion(flowState)` で決定する。

方針:
- 未生成時の回答対象は `const pendingQuestion = getNextQuestion(flowState)` に一本化
- `pendingQuestion === null` の場合のみ完了済みとして扱う
- 初回回答も特例分岐ではなく同じロジックで処理する
- ユーザーメッセージ表示には `pendingQuestion.summarize(answerValue)` を使う

対象ファイル:
- `src/components/AppShell.tsx`

### 1-C: `flowEngine.ts` の壊れた helper を放置しない

`getCurrentQuestion()` は現状の定義だと completed list を current index で参照しており、意味が破綻している。再発防止のため次のいずれかを必ず行う。

- 使わないなら export ごと削除する
- 残すなら「現在表示すべき未回答質問」を返す実装に直す

今回の実装では `AppShell` から参照を外すだけで終わらせない。

対象ファイル:
- `src/brief/flowEngine.ts`
- `src/components/AppShell.tsx`

### 1-D: ステップ戻りの不整合修正

現状は `InterviewProgress` 側の step 値と `handleStepClick` 側の解釈が噛み合っておらず、`goBack()` 一回では任意ステップへの移動になっていない。

対応方針:
- `InterviewProgress` から渡す step を 0-based か 1-based かで統一する
- `handleStepClick` は `goBack()` 一回に頼らず、選択 step まで state/messages を再構築する
- 戻った後の `completedQuestionIds`、`answers`、`isComplete` を再計算する

対象ファイル:
- `src/components/InterviewProgress.tsx`
- `src/components/AppShell.tsx`
- 必要なら `src/brief/flowEngine.ts`

### Milestone 1 検証

1. テーマ入力後に `sourceMaterialType` が表示され、同じ質問ループに入らない
2. `outputTarget = lovart-slides` で `intent -> slideStyle -> slideCount -> tone -> targetAudience` に進む
3. `outputTarget = external-infographic-image` で外部インフォグラフィック用の質問群に進む
4. 進捗ステップクリックで意図した位置へ戻れる
5. 全質問回答後に summary と generate 導線が表示される

---

## Milestone 2: 生成経路の整合性修正（P1）

`AppShell.tsx` では `compileBrief(flowState.answers)` を作っているのに、その結果を使わず旧来の `generateSlideStructure()` に流している。ここを実際のフロー分岐と揃える。

対応方針:
- `handleGenerate` を `compileBrief(...)` + `generateSlidesFromBrief(...)` ベースに統一する
- `outputTarget = lovart-slides` のときだけ背景画像生成ループを回す
- `outputTarget = external-infographic-image` のときは slide-only な既定値に寄せず、brief ベースの生成結果を扱う
- 使っていない `compiledBrief` 変数を残さない

対象ファイル:
- `src/components/AppShell.tsx`
- 必要なら `src/services/geminiService.ts`

### Milestone 2 検証

1. `lovart-slides` で従来どおり複数スライド生成が成功する
2. `external-infographic-image` でも生成処理が分岐し、ランタイムエラーにならない
3. 生成中に console error や不要な分岐漏れがない

---

## Milestone 3: インタビュー画面レイアウト調整（P1）

ここの本質は中央寄せではなく、`max-w-4xl` がワイド画面で窮屈なことにある。

対応方針:
- コンテナは `w-full` を維持
- 最大幅を `max-w-5xl` ないし `max-w-[1200px]` 程度まで拡張
- 必要なら `mx-auto` を追加して意図を明示
- チャット本文、summary、composer が横幅拡張後も崩れないことを確認する

対象ファイル:
- `src/components/AppShell.tsx`

### Milestone 3 検証

1. 1280px 以上の画面でインタビュー UI が窮屈に見えない
2. 横幅を広げても chat list と composer のレイアウトが崩れない

---

## Milestone 4: 3カラム・スクロール可能スライド UI（P2）

### 4-A: `InterviewHistoryPanel` 新規作成

新規ファイル:
- `src/components/InterviewHistoryPanel.tsx`

役割:
- 左カラム専用の読み取り専用パネル
- `getAnsweredQuestions(flowState)` と `getAnswerSummaries(flowState)` を使って Q&A 履歴を表示
- 下部に `compileBrief(flowState.answers)` ベースの簡易 summary を表示

注意:
- 既存 `BriefSummaryCard` は生成ボタンや generated 前提の表示があるため、そのまま流用しない
- 必要なら readonly variant を追加するが、最小変更で済むなら `InterviewHistoryPanel` 内で専用表示を持つ

想定 props:
```ts
interface InterviewHistoryPanelProps {
  flowState: FlowState;
  className?: string;
  style?: React.CSSProperties;
}
```

### 4-B: `CenterPreviewWorkspace` を全スライド縦スクロール型に変更

修正ファイル:
- `src/components/CenterPreviewWorkspace.tsx`

変更内容:
- 単一スライド表示をやめ、全スライドを縦に並べる
- `Prev/Next` ナビゲーションを削除
- アクティブスライドのみリングハイライト
- スライドクリックで `activeSlideId` を更新
- 要素クリックで `activeSlideId` と `selectedElementId` を同時更新
- スライド選択時のみ `scrollIntoView({ behavior: 'smooth', block: 'center' })` を使う
- 16:9 比率は各スライドカード内で維持する

新 props:
```ts
interface CenterPreviewWorkspaceProps {
  slides: SlideData[];
  activeSlideId: string | null;
  selectedElementId: string | null;
  onSelectSlide: (id: string) => void;
  onSelectElement: (id: string | null) => void;
  onUpdateElement: (elementId: string, updates: Partial<ElementData>) => void;
  designToken?: DesignToken;
}
```

### 4-C: `SlideThumbnailRail` は render tree から外す

中央カラムで全スライドを一覧できるため、底部レールは不要。

対応:
- `AppShell.tsx` から描画と import を削除
- コンポーネントファイル自体の削除は最後に参照がなければ行う

対象ファイル:
- `src/components/AppShell.tsx`
- `src/components/SlideThumbnailRail.tsx`（必要なら削除）

### 4-D: `AppShell` の editor mode 統合

修正内容:
- 左カラムを `ChatInterviewSidebar` から `InterviewHistoryPanel` に差し替える
- 中央カラムへ `slides` 全体と `activeSlideId` を渡す
- 右カラムは既存 `RightInspectorPanel` を維持する
- 既存の左右ドラッグリサイズは保持する
- スライド切替時に `selectedElementId` を適切にクリアまたは同期する

対象ファイル:
- `src/components/AppShell.tsx`
- `src/components/InterviewHistoryPanel.tsx`
- `src/components/CenterPreviewWorkspace.tsx`

### Milestone 4 検証

1. 生成後に 3 カラム UI が表示される
2. 左カラムに Q&A 履歴と brief summary が読み取り専用で表示される
3. 中央カラムに全スライドが縦スクロールで並ぶ
4. スライドクリックで active state が切り替わる
5. 要素クリックで右パネルの編集対象が切り替わる
6. 右パネルの編集結果が中央カラムへ即時反映される
7. 左右リサイズハンドルが壊れない

---

## 実行順序

1. Milestone 0
2. Milestone 1
3. Milestone 2
4. Milestone 3
5. Milestone 4-A / 4-B を並行実装
6. Milestone 4-C / 4-D で統合
7. ローカル検証
8. Chrome DevTools 検証
9. デプロイ後スモークテスト

---

## 最終検証

### 自動・準自動確認

- `npm run lint` で TypeScript 型チェック通過
- `npm run build` でビルド成功

### ローカル手動確認

1. `lovart-slides` フローを最後まで完走し、生成と編集まで通す
2. `external-infographic-image` フローも最後まで進め、分岐漏れや生成エラーがないことを確認する
3. 進捗ステップ戻り、生成後編集、左右リサイズの 3 点を重点確認する

### Chrome DevTools 検証

最終段階では、Claude に Chrome DevTools を使わせてゲストモードで実操作確認させる。

手順:
1. ローカルで開発サーバーを起動する
2. Chrome を Guest Mode で開く
3. Console に runtime error が出ていないことを確認する
4. Network で同一質問ループや不要な連続リクエストが起きていないことを確認する
5. `lovart-slides` の実フローを完走し、3 カラム UI と編集反映を確認する
6. 必要に応じて `external-infographic-image` 側も同様に確認する

### デプロイ前後

- ローカルの Guest Mode 検証が通ってからコミット・プッシュする
- Render デプロイ後も Guest Mode で最小スモークテストを行う
