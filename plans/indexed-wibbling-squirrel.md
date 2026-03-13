# Plan: ウィザードUI改善 — 100%表示対応 + 自動遷移

## 判断

元の方針は大筋で妥当だが、そのまま進めるのは避ける。
以下の3点が抜けていたため、実装計画を補強する。

1. **高さ問題の責務が曖昧**  
   `AssistantShell` の `h-[85vh]` だけを触っても不十分。`AppShell` 側の残り高、`min-h-0`、内部スクロール領域をセットで調整しないと 100% 表示で再発しうる。
2. **任意ステップのスキップ導線が消える**  
   `supplementary` は `required: false`。choice 系でフッターを消すだけだと未回答のまま先へ進む手段がなくなる。
3. **自動遷移で連打時に 2 ステップ飛ぶ恐れがある**  
   現在の reducer は `fieldId` と `activeStepIndex` の整合チェックをしていない。選択肢クリックで即 `onCommit` するなら、二重送信ガードを入れる。

## Goal

スクリーンショットで確認された 2 つの問題を、安全に修正する。

1. **100%倍率でウィザード全体が見えること**
2. **choice 系ステップは選択と同時に次へ進むこと**

あわせて、以下も壊さないことを前提にする。

- 戻る操作で既存回答が復元される
- 任意ステップはスキップできる
- review 画面のレイアウトと操作は維持される

## M1: 高さ制御の整理

### 変更ファイル

- [AppShell.tsx](src/components/AppShell.tsx)
- [AssistantShell.tsx](src/components/assistant/AssistantShell.tsx)
- [WizardStepDialog.tsx](src/components/assistant/WizardStepDialog.tsx)
- [WizardReviewView.tsx](src/components/assistant/WizardReviewView.tsx)

### 変更内容

1. **`AppShell` 側で利用可能な高さに収める**
   - 画面中央寄せのまま固定 `85vh` を置くのではなく、ヘッダー下の残り領域内でウィザードが収まる構造にする
   - 必要なら `justify-center` 依存を弱め、`flex-1 min-h-0` を基準にシェルを配置する

2. **`AssistantShell` を「固定高」ではなく「親の残り高を使う」設計に寄せる**
   - `h-[85vh]` をやめ、`h-full` / `max-h-full` / `min-h-0` ベースに変更する
   - ヘッダー、タブ、本文の 3 層構造を維持しつつ、本文領域に `flex-1 min-h-0` を通す

3. **本文スクロールを各ビューで正しく成立させる**
   - `WizardStepDialog` と `WizardReviewView` の root も `min-h-0` を持てるようにする
   - choice リストや review サマリーは本文だけスクロールし、シェル全体は崩さない

### 完了条件

- 100% 表示でヘッダー、タブ、質問文、選択肢、操作導線が同一画面内に収まる
- 内容が多い場合のみ本文領域が内部スクロールする

## M2: choice 系ステップの自動遷移

### 変更ファイル

- [WizardStepDialog.tsx](src/components/assistant/WizardStepDialog.tsx)
- [ChoiceOptionCard.tsx](src/components/assistant/ChoiceOptionCard.tsx)

### 変更内容

1. **preset 選択肢はクリック即コミット**
   - `single-choice` と `grid-choice` の preset は `onSelect` で即 `onCommit`
   - 戻ってきた後に別の preset を選び直した場合も、そのまま上書きして次へ進む

2. **custom は従来どおり手動送信**
   - `mode === 'custom'` のみ、選択後に入力欄を開く
   - テキストが空ならコミットしない
   - Enter 送信は維持する

3. **二重送信ガードを入れる**
   - choice 選択直後に一時的なロックを入れ、連打やダブルクリックで 2 ステップ進まないようにする
   - 必要なら `ChoiceOptionCard` に `disabled` 相当の props を追加する

### 完了条件

- preset のクリック 1 回で確実に次ステップへ進む
- 連打してもステップを飛ばさない
- custom 選択時だけ入力待ちになる

## M3: 戻る導線と任意ステップの扱い

### 変更ファイル

- [WizardStepDialog.tsx](src/components/assistant/WizardStepDialog.tsx)

### 変更内容

1. **戻るボタンは質問ヘッダー側へ寄せる**
   - choice 系で主フッターを消しても、常に戻れる位置を確保する
   - text 系でも位置をそろえるかは実装時に比較し、視線移動が少ない方を採用する

2. **フッターは「必要なときだけ」出す**
   - `text` ステップ: 主ボタンを表示
   - `custom` 入力中: 送信ボタンを表示
   - preset の choice ステップ: 主ボタンを非表示

3. **任意ステップのスキップを残す**
   - `required: false` の choice ステップでは、未選択のまま進める `スキップ` 導線を残す
   - これにより `supplementary` で詰まらないようにする

### 完了条件

- すべてのステップで戻る操作が可能
- `supplementary` を未入力のまま review へ進める

## 実装メモ

- 自動遷移の責務は `WizardStepDialog` に寄せ、`ChoiceOptionCard` は極力プレゼンテーションに留める
- 見た目の微調整より、まず高さ制御と状態遷移の安全性を優先する
- 150ms アニメーションは必須ではない。即遷移 UX と競合しやすいため、今回は優先度を落とす

## 検証

1. `npm run lint`
2. `npm run build`
3. ブラウザ確認
   - 100% 表示でウィザード全体が破綻しない
   - preset 選択で即次へ進む
   - custom 選択時のみ入力欄と送信導線が出る
   - `supplementary` をスキップできる
   - 戻るで回答内容が復元される
   - review 画面でも本文だけがスクロールする
   - choice を素早く連打しても 2 ステップ飛ばない
