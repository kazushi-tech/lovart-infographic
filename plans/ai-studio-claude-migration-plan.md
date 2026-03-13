# Plan: AI Studio 参照実装を取り込みつつ Claude風ウィザードへ移植する実装計画

## 0. この計画の目的

この計画は、Google AI Studio で生成された完成度の高い UI を **参照実装として安全に取り込み**、現在の `lovart-infographic` リポジトリへ **壊れにくい構造のまま移植**するためのもの。

目標は次の 2 点を同時に満たすこと:

1. **見た目と操作感を AI Studio 版に寄せる**
2. **内部状態はこのリポ向けに整理された `screen + reducer + BriefDraft` 構成を維持する**

重要なのは、AI Studio のダウンロードコードをそのまま本番ソースに混ぜることではなく、**UI の勝ち筋を抽出して移植すること**である。

---

## 1. 前提と制約

### 1-1. 前提

- 現在の runtime source はこのリポの root 配下 `src/` にある
- 既存の主要な状態管理は `src/components/AppShell.tsx` に集中している
- 生成処理は `src/services/geminiService.ts` が担っている
- 生成後 UI は 3 カラムの editor である

### 1-2. このリポで守る制約

- AI Studio のダウンロードコードは **実行ソースとして直置きしない**
- `reference/` を runtime source の起点として使わない
- 文字コードは UTF-8（BOM なし）
- 大きなレイアウト移植前には Git コミットを切る
- AI Studio 側の package 構成・依存は鵜呑みにせず、必要最小限だけ採用する

### 1-3. AI Studio コードの置き場所

AI Studio からダウンロードしたコードは、次のような **凍結スナップショット** として保存すること:

```text
archive/
  ai-studio/
    2026-03-13-infographic-generator-ui/
      ...downloaded source...
```

このディレクトリは **read-only の参照用** とし、runtime import の起点にはしない。

---

## 2. 目標 UI

添付スクリーンショットと AI Studio 版から読み取れる、今回の target UX は以下。

### 2-1. Empty state

- 画面中央に assistant panel がある
- panel 内に welcome view が表示される
- CTA は 2 つ
  - `要件を入力する`
  - `サンプルで試す`

### 2-2. Question state

- panel 内に暗色の質問カードが表示される
- 上部に step tabs がある
  - `テーマ`
  - `ターゲット`
  - `スライド枚数`
  - `デザイン`
- 1 問ずつ回答する
- 選択肢は radio 風に見せる
- 選択しただけでは進まず、`次へ` で確定する
- `その他` を選んだ場合は自由入力へ切り替える

### 2-3. Review state

- assistant メッセージの下に要件サマリーカードを表示する
- サマリーは label ベースで読みやすく表示する
- 主 CTA は `スライドを生成する`
- 下部には追加指示欄を出してよいが、初期段階では再生成ロジックなしでもよい

### 2-4. Editor state

- 生成完了後は 3 カラム editor に遷移する
- 左カラムは AI Studio 風の assistant shell に寄せる
- ただし editor の中心 preview と right inspector の主要機能は現状維持

---

## 3. 実装方針

### 3-1. AI Studio は「デザイン参照 + JSX 構造参照」に限定する

採用してよいもの:

- レイアウト構成
- カード階層
- 配色、余白、境界線
- ボタンや tab の見せ方
- step 遷移の見た目

採用してはいけないもの:

- そのままの状態管理
- そのままの package.json
- そのままの app ルーティング
- 不明な外部依存
- このリポの生成フローと競合するデータモデル

### 3-2. 先に構造、後で見た目

移植順は次の順で行う:

1. `screen` と reducer を安定化
2. `BriefDraft` で handoff を固定
3. AI Studio 風の shell / wizard UI に差し替え
4. review / generating / editor を見た目合わせ

見た目を先にコピーすると、`messages` 正本設計へ逆戻りしやすいので避ける。

### 3-3. 画面状態は `screen` を正本にする

```ts
type AppScreen = 'wizard' | 'review' | 'generating' | 'editor';
```

`isGenerated` と `currentQuestionIndex` を主状態として引っ張り続けるのはやめる。

### 3-4. 回答状態は reducer に集約する

```ts
interface InterviewWizardState {
  activeStepIndex: number;
  answers: Partial<Record<InterviewFieldId, AnswerEntry>>;
  phase: 'idle' | 'collecting' | 'review';
}
```

### 3-5. 生成 API への入力は `BriefDraft`

生成前 UI はどれだけ変わっても、`generateSlideStructure()` に渡す入力契約は安定させる。

---

## 4. 既存コードの問題点（Claude が最初に理解すべきこと）

### 4-1. `AppShell.tsx` に責務が集中している

対象:
- `src/components/AppShell.tsx:95`
- `src/components/AppShell.tsx:142`
- `src/components/AppShell.tsx:234`
- `src/components/AppShell.tsx:305`
- `src/components/AppShell.tsx:382`

問題:
- welcome
- interview flow
- sample flow
- generation
- editor layout

を 1 ファイルで抱えている。

### 4-2. `messages` が事実上の進行状態になっている

対象:
- `src/components/AppShell.tsx:171`
- `src/components/AppShell.tsx:323`
- `src/components/ChatInterviewSidebar.tsx:49`
- `src/components/ChatInterviewSidebar.tsx:104`

問題:
- 進行中の質問
- 過去の選択肢
- summary 表示用 style options

が message 履歴に依存している。

AI Studio 風の 1 問カード UI と根本的に噛み合わない。

### 4-3. `テーマを入力する` 導線が正しい入力開始になっていない

対象:
- `src/components/ChatInterviewSidebar.tsx:79`
- `src/components/AppShell.tsx:158`

問題:
- `テーマを入力する` という文言自体が `theme` として保存されうる

### 4-4. 表示ラベルと制御値が分離されていない

対象:
- `src/components/AppShell.tsx:164`
- `src/components/BriefSummaryCard.tsx:42`
- `src/services/geminiService.ts:116`

問題:
- style や slideCount だけでなく、他の回答でも内部値の扱いが曖昧

---

## 5. Claude に要求する最終アーキテクチャ

### 5-1. ディレクトリ構成

推奨:

```text
archive/
  ai-studio/
    2026-03-13-infographic-generator-ui/

src/
  interview/
    schema.ts
    state.ts
    brief.ts
  components/
    assistant/
      AssistantShell.tsx
      WizardWelcomeView.tsx
      WizardStepDialog.tsx
      WizardReviewView.tsx
      WizardStepTabs.tsx
      ChoiceOptionCard.tsx
```

補足:
- `assistant/` は **AI Studio 風見た目の UI 層**
- `interview/` は **状態・型・変換**

### 5-2. 既存ファイルの役割再編

| ファイル | 変更後の役割 |
|---------|--------------|
| `src/components/AppShell.tsx` | screen 切り替え、API キー管理、生成開始、editor state のみ |
| `src/components/BriefSummaryCard.tsx` | `BriefDraft` 表示専用 |
| `src/components/ChatInterviewSidebar.tsx` | editor 左カラム専用、生成前進行ロジックを持たない |
| `src/services/geminiService.ts` | `BriefDraft` を受けて構成生成する |

### 5-3. 質問定義

初期版の step は固定:

1. `theme`
2. `targetAudience`
3. `slideCount`
4. `styleId`

必要なら拡張 step:

5. `keyMessage`
6. `tone`
7. `supplementary`

AI Studio 版の画面に寄せるなら、最初の 4 step を前面に出し、後半は advanced step としてまとめてもよい。

### 5-4. `その他` 選択肢の扱い

AI Studio 版では `その他` が自然に入っているため、各 step に以下を用意する:

```ts
{
  id: 'other',
  label: 'その他',
  description: '自由に入力する',
  mode: 'custom'
}
```

動作:
- `other` を選ぶ
- 追加テキスト入力欄を開く
- commit 時に `value` と `label` を両方埋める

### 5-5. review 画面

review は message 履歴ではなく、`BriefDraft` の読み取り専用表示にする。

表示項目:
- テーマ
- ターゲット
- スライド枚数
- デザイン
- 任意で keyMessage / tone / supplementary

---

## 6. 実装マイルストーン

## M0. AI Studio スナップショットの取り込みと監査

### 対象

- **新規ディレクトリ** `archive/ai-studio/2026-03-13-infographic-generator-ui/`
- **新規メモ** `plans/ai-studio-component-audit.md`（推奨）

### やること

1. AI Studio ダウンロードコードを `archive/ai-studio/...` に展開する
2. 主要エントリ、使用コンポーネント、依存パッケージを確認する
3. このリポに持ち込むべき UI 要素を一覧化する

### 監査で書くべき内容

- AI Studio 側の entry file
- UI のレイアウト構造
- 使用している色、 spacing、 border radius
- wizard card の階層
- そのまま使えない依存
- 再利用候補の JSX ブロック

### 壊れうるシナリオ

- snapshot を runtime import し始めて依存関係が壊れる

### 完了条件

- AI Studio コードが read-only 参照として保存されている
- runtime source から直接 import されていない

---

## M1. interview state の安定化

### 対象ファイル

- **新規** `src/interview/schema.ts`
- **新規** `src/interview/state.ts`
- **新規** `src/interview/brief.ts`
- **変更** `src/components/AppShell.tsx`

### やること

1. `InterviewFieldId`, `AnswerEntry`, `BriefDraft`, `InterviewStep` を定義する
2. step 定義と選択肢定義を `schema.ts` に置く
3. reducer と sample data を `state.ts` に置く
4. `buildBriefDraft()` を `brief.ts` に置く
5. `AppShell` から `messages` 依存の interview progress を外す

### 差分イメージ

```diff
- const [isGenerated, setIsGenerated] = useState(false);
- const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1);
- const [messages, setMessages] = useState<ChatMessage[]>(...);
+ const [screen, setScreen] = useState<AppScreen>('wizard');
+ const [wizardState, dispatch] = useReducer(interviewWizardReducer, createInitialWizardState());
+ const briefDraft = buildBriefDraft(wizardState.answers);
```

### 壊れうるシナリオ

- `screen` と既存 `isGenerating` の整合が崩れる
- sample flow が reducer に統合されず二重経路になる

### 検証

- [ ] `npm run lint`
- [ ] `npm run build`
- [ ] `テーマを入力する` で本当に入力開始になる
- [ ] `サンプルで試す` が `review` または completed wizard へ遷移する

---

## M2. AI Studio 風の assistant shell を実装

### 対象ファイル

- **新規** `src/components/assistant/AssistantShell.tsx`
- **新規** `src/components/assistant/WizardWelcomeView.tsx`
- **新規** `src/components/assistant/WizardStepTabs.tsx`
- **変更** `src/components/AppShell.tsx`

### やること

1. AI Studio スクショに近い panel 枠を作る
2. 上部ヘッダ、タイトル、暗色背景、内側カード領域を再現する
3. empty state の CTA を welcome view として実装する
4. `screen === 'wizard'` のとき、この shell を表示する

### 移植元として参照するもの

- AI Studio 側の panel 幅感
- header の余白
- CTA ボタンの見た目
- 背景トーン

### やってはいけないこと

- AI Studio の app root を丸ごと貼る
- 依存ごと持ち込む

### 壊れうるシナリオ

- AppShell 既存の中央寄せレイアウトと競合して panel が崩れる

### 検証

- [ ] empty state が AI Studio 版に近いレイアウトになる
- [ ] desktop 幅で panel が細すぎたり広すぎたりしない
- [ ] mobile 幅で padding と CTA が崩れない

---

## M3. 1問ずつの wizard dialog を AI Studio 風に実装

### 対象ファイル

- **新規** `src/components/assistant/WizardStepDialog.tsx`
- **新規** `src/components/assistant/ChoiceOptionCard.tsx`
- **変更** `src/components/AppShell.tsx`

### やること

1. 現在の active step だけを表示する dialog/card を作る
2. step tabs を上部に表示する
3. option card は radio 風 UI にする
4. `その他` 選択時の自由入力欄を実装する
5. `次へ` / `戻る` / `閉じる` の動作を reducer と接続する

### 動作要件

- 選択だけではコミットしない
- `次へ` でコミット
- 既回答 step に戻ると前回値が表示される
- last step 完了後に `screen = 'review'`

### 壊れうるシナリオ

- local pending state と reducer state がずれる
- `その他` 入力が空のまま commit される

### 検証

- [ ] 4 step 連続で進める
- [ ] 2 step 戻って再編集できる
- [ ] `その他` から自由入力できる
- [ ] step 表示は 1-based、内部 index は 0-based のまま保たれる

---

## M4. Review 画面を AI Studio 風に寄せつつ `BriefDraft` へ接続

### 対象ファイル

- **新規** `src/components/assistant/WizardReviewView.tsx`
- **変更** `src/components/BriefSummaryCard.tsx`
- **変更** `src/components/AppShell.tsx`

### やること

1. assistant メッセージ + summary card 構成を作る
2. `BriefDraft` を label ベースで表示する
3. 主 CTA `スライドを生成する` を review 画面下部に配置する
4. 追加指示欄は editor 再生成未対応でも UI だけ用意してよい

### 移植元として参照するもの

- summary card の密度
- CTA 幅
- 下部入力欄の見せ方

### 壊れうるシナリオ

- `BriefDraft` に `styleLabel` がなければ style 名が内部 ID のまま出る

### 検証

- [ ] review で内部 ID が見えない
- [ ] `スライドを生成する` が 1 つだけ主 CTA として目立つ
- [ ] sample flow でも review 表示が崩れない

---

## M5. 生成フローと editor 遷移の安定化

### 対象ファイル

- **変更** `src/components/AppShell.tsx`
- **変更** `src/services/geminiService.ts`
- **変更** `src/components/ChatInterviewSidebar.tsx`

### やること

1. `generateSlideStructure()` の入力を `BriefDraft` に寄せる
2. 生成開始時は `screen = 'generating'`
3. 構成生成完了後は `screen = 'editor'`
4. editor 左カラムを AI Studio 風 assistant shell の post-generate 表示へ寄せる
5. `ChatInterviewSidebar` に残る legacy interview progress を除去する

### 差分イメージ

```diff
- const newSlides = await generateSlideStructure(interviewData, resolvedGeminiKey);
- setIsGenerated(true);
+ const newSlides = await generateSlideStructure(briefDraft, resolvedGeminiKey);
+ setScreen('editor');
```

### 壊れうるシナリオ

- `activeSlideId` 未設定で editor 表示に入る
- 生成中 overlay が wizard と editor で二重表示される

### 検証

- [ ] review から生成開始で editor に遷移する
- [ ] スライド 1 枚目が必ず active になる
- [ ] 背景画像生成が遅くても editor が破綻しない

---

## M6. AI Studio との差分調整と cleanup

### 対象ファイル

- `src/index.css`
- `src/components/assistant/*`
- `src/components/AppShell.tsx`

### やること

1. 角丸、余白、文字色、 hover 状態を AI Studio 版に寄せる
2. 不要になった interview 用チャット前提ロジックを削除する
3. 開発用の UI state トグルが必要なら dev-only に閉じ込める

### 壊れうるシナリオ

- 見た目合わせで class が肥大化し、再利用性が落ちる

### 検証

- [ ] AI Studio 版と主要画面の構図が近い
- [ ] CSS の重複が過剰でない
- [ ] 既存 editor レイアウトが壊れていない

---

## 7. 触らないもの

- `src/components/CenterPreviewWorkspace.tsx` の主要レイアウト
- `src/components/RightInspectorPanel.tsx` の編集 UX
- `src/components/SlideThumbnailRail.tsx` の選択ロジック
- 背景画像生成 API の仕様
- Router 導入
- 本格的な再生成チャット機能

---

## 8. 受け入れ基準

### 機能面

- 起動時に AI Studio 風の welcome view が表示される
- `要件を入力する` で wizard が開始する
- `サンプルで試す` で review または completed state に入る
- 質問は 1 問ずつ表示される
- `その他` を選ぶと自由入力できる
- review から生成できる
- 生成後は editor に遷移する

### UI 面

- assistant panel の雰囲気が AI Studio 版に近い
- wizard card が中央に安定表示される
- summary card と CTA の優先順位が明確
- dark theme のコントラストが破綻しない

### 品質面

- `npm run lint` PASS
- `npm run build` PASS
- sample flow / manual flow の両方で遷移が通る

---

## 9. Claude への実行指示

以下を Claude にそのまま渡してよい。

```text
このリポジトリで、AI Studio で生成した UI を参照実装として取り込みつつ、
現在のアプリを Claude風の選択式ウィザード UI に再設計してください。

前提:
- AI Studio のダウンロードコードは archive/ai-studio/2026-03-13-infographic-generator-ui/ に置く
- そのコードは read-only の参照用であり、runtime source として直接 import しない
- runtime source はこの repo の src/ 配下を維持する

必須方針:
- screen: 'wizard' | 'review' | 'generating' | 'editor' を導入する
- interview state は reducer を正本にする
- generateSlideStructure() への入力は BriefDraft に統一する
- 生成前 UI は chat log ではなく、1問ずつの wizard card にする
- AI Studio の見た目は積極的に寄せるが、状態管理はこの repo 向けに再構築する

やる順番:
1. archive 配下の AI Studio スナップショットを監査する
2. interview/schema.ts, state.ts, brief.ts を作る
3. AppShell を screen + reducer ベースに整理する
4. AI Studio 風の AssistantShell / Wizard UI を src/components/assistant/ に実装する
5. Review 画面と generate フローを BriefDraft ベースで接続する
6. editor 左カラムを post-generate assistant shell に寄せる
7. lint/build を通す

禁止:
- AI Studio コードを丸ごと runtime にコピーして使うこと
- package.json を AI Studio 版で上書きすること
- reference/ を runtime source とみなすこと
- messages を再び interview state の正本に戻すこと

実装後に報告してほしい内容:
- 新規ファイル一覧
- 変更ファイル一覧
- 画面遷移の before/after
- AI Studio 版から移植した UI 要素一覧
- lint/build 結果
```

---

## 10. 追加メモ

もし AI Studio ダウンロードコードに、現在の runtime と相性の悪い依存が含まれていた場合は、**コード移植ではなく画面構造の再実装**を優先すること。

この計画の成功条件は「AI Studio のコードを使った」ことではなく、「AI Studio と同じレベルの UI を、このリポの健全な状態管理の上で再現した」ことである。
