# Plan: Claude風の選択式インタビューウィザードへの再設計

## 0. 要約

この改修の主目的は、現在の「メッセージ履歴ベースの疑似チャット」を、Claude の Ask User's Question に近い「構造化された選択式ウィザード」に置き換えること。

やること:
- テーマ入力後のヒアリングを、1問ずつ回答する専用 UI に切り替える
- 回答結果を `BriefDraft JSON` として独立管理する
- 生成前の画面遷移を `screen` 状態で明示的に管理する
- 生成完了後に 3 カラムエディターへ確実に遷移させる

今回やらないこと:
- React Router の導入
- 3 カラムエディターの大規模な再設計
- 画像生成プロバイダ切り替え
- AI に質問順そのものを決めさせること

重要な方針:
- **UI だけ Claude 風にするのではなく、状態モデルを Claude 風ウィザード向けに作り直す**
- **`messages` は状態の正本にしない**
- **質問順は固定し、AI は将来の補助機能に留める**

---

## 1. 現状スナップショット

### 1-1. 変更対象の主要ファイル

| ファイル | 現在の主な責務 | 現状の問題 |
|---------|----------------|-----------|
| `src/components/AppShell.tsx` | アプリ全体の状態管理、ヒアリング進行、生成、3カラム表示 | 状態責務が集中しすぎており、`isGenerated` と `currentQuestionIndex` が UI 切り替えと進行管理を兼ねている |
| `src/components/ChatInterviewSidebar.tsx` | チャット UI、進捗表示、要約カード、Composer | 「チャット履歴」を前提にした構造で、Claude 風の質問ウィザードと相性が悪い |
| `src/components/InterviewProgress.tsx` | ステップ表示と戻り操作 | 呼び出し側との step index 契約が曖昧 |
| `src/components/BriefSummaryCard.tsx` | 収集済み要件の表示 | `InterviewData` をそのまま表示し、内部 ID と表示ラベルの分離がない |
| `src/services/geminiService.ts` | スライド構成生成と背景画像生成 | 生成プロンプトに内部 ID がそのまま入る可能性がある |
| `src/demoData.ts` | 型定義・ダミーデータ | 実運用向けの interview 型と demo 型が混在している |

### 1-2. 現在のユーザーフロー

1. 起動時に `welcome-msg` を持つメッセージ配列を表示する
2. `テーマを入力する` または `サンプルで試す` を押す
3. `currentQuestionIndex` と `QUESTIONS` 配列で次の質問を決める
4. 全質問完了後に `BriefSummaryCard` を表示する
5. `generateSlideStructure()` 成功時に `isGenerated = true` にして 3 カラムレイアウトへ切り替える

### 1-3. 現在の構造上の問題

#### 問題 1: 「テーマを入力する」ボタンが実質バグになっている

- `src/components/ChatInterviewSidebar.tsx` L79-L89 は `onSendMessage('テーマを入力する')` を送る
- `src/components/AppShell.tsx` L158-L160 は、その文字列を `theme` として保存する
- 結果として、本来は入力待ちにしたい場面でテーマが固定文言になる

#### 問題 2: ヒアリング進行が `messages` と `currentQuestionIndex` に分散している

- `src/components/AppShell.tsx` L142-L204 では、回答保存と次質問追加を同じ関数で処理している
- `src/components/AppShell.tsx` L305-L351 では、戻る操作時に「過去メッセージを再構成せず、新しい質問を追記」している
- この構造では、ウィザード型 UI ではなく「増え続ける会話ログ」になる

#### 問題 3: ステップ管理の index 契約が不安定

- `src/components/InterviewProgress.tsx` L21-L23 は `onStepClick(i)` を呼ぶ
- `src/components/AppShell.tsx` L308 は `const newIndex = step - 1` として扱う
- 0-based と 1-based の責務が混在しており、戻り操作のバグ要因になる

#### 問題 4: 選択肢ステップでは自由入力が構造的にできない

- `src/components/ChatInterviewSidebar.tsx` L49-L50 で最後の質問が `options` なら Composer を無効化する
- `src/components/ChatInterviewSidebar.tsx` L123-L126 も同じ前提で placeholder を固定している
- Claude 風 UI の「選択肢 + 必要ならテキスト補足」と噛み合わない

#### 問題 5: 生成前の要件データが不十分

- `src/components/AppShell.tsx` L164 では選択肢 `id` をそのまま保存している
- `src/components/BriefSummaryCard.tsx` L38-L48 と `src/services/geminiService.ts` L116-L122 がそれを直接読む
- 表示ラベルと内部値が分離されていないため、要約表示と生成プロンプトの品質が不安定になる

---

## 2. 目標 UX

生成前の画面は、チャットログではなく **1問ずつ進めるウィザード** にする。

### 2-1. 目標フロー

1. `テーマ入力`
2. `質問ウィザード開始`
3. `各ステップで選択または自由入力`
4. `要件確認（Review）`
5. `生成中`
6. `3カラムエディター`

### 2-2. 各ステップの見た目

- 画面上部にステップタブまたは進捗インジケータを表示する
- 中央に現在の質問カードを 1 枚だけ表示する
- 回答形式は以下のいずれか
  - single-choice: ラジオ形式
  - multi-choice: 将来拡張用、今回は不要なら見送る
  - text: 自由入力
  - choice + free text: 選択肢 + 補足入力
- 回答は **選択しただけで即送信しない**
- `次へ` または `回答を確定` ボタンでコミットして進む

### 2-3. サンプル導線

- `サンプルで試す` はメッセージ追加ではなく、サンプル回答を reducer に投入する
- そのまま `Review` 画面へ遷移させる

### 2-4. 生成後の扱い

- 3 カラムエディターに遷移した後は、左カラムに「要件サマリー + 追加指示」を表示してよい
- ただしその表示は **`BriefDraft JSON` から派生表示** し、過去メッセージ履歴に依存しない

---

## 3. 目標アーキテクチャ

### 3-1. 状態の正本

生成前の正本は `messages` ではなく `InterviewWizardState` にする。

```ts
type AppScreen = 'wizard' | 'review' | 'generating' | 'editor';

type InterviewFieldId =
  | 'theme'
  | 'styleId'
  | 'slideCount'
  | 'targetAudience'
  | 'keyMessage'
  | 'tone'
  | 'supplementary';

interface AnswerEntry {
  fieldId: InterviewFieldId;
  value: string;
  label?: string;
  source: 'choice' | 'text' | 'sample';
}

interface BriefDraft {
  theme: string;
  styleId?: 'corporate' | 'professional' | 'executive' | 'modern' | 'minimal';
  styleLabel?: string;
  slideCount?: '3' | '5' | '8' | '10';
  targetAudience?: string;
  keyMessage?: string;
  tone?: string;
  supplementary?: string;
}

interface InterviewWizardState {
  activeStepIndex: number;
  answers: Partial<Record<InterviewFieldId, AnswerEntry>>;
  phase: 'idle' | 'collecting' | 'review';
}
```

### 3-2. 質問順は固定、質問文と選択肢定義もまず固定

Claude 風 UI を成立させる上で重要なのは「選択式ウィザード」であり、「質問を AI が毎回生成すること」ではない。

そのため初期実装では、次の固定ステップを使う:

1. `theme`
2. `styleId`
3. `slideCount`
4. `targetAudience`
5. `keyMessage`
6. `tone`
7. `supplementary`

AI による質問文の動的生成は **Phase 2 の拡張** とし、初期実装には含めない。

### 3-3. 表示用ラベルと保存値を分離する

例:

- `styleId.value = 'professional'`
- `styleId.label = 'Professional（プロフェッショナル）'`
- `targetAudience.value = '経営層・役員'`
- `targetAudience.label = '経営層・役員'`

この分離により、以下を両立する:

- UI 表示では自然な文言を使う
- JSON 受け渡しでは安定した値を使う
- 生成プロンプトには必要に応じて label/value のどちらも埋め込める

### 3-4. 画面遷移は `screen` で管理する

現在の `isGenerated` では、以下が同居している:

- 生成前かどうか
- 生成中かどうか
- エディターを表示してよいか

これを明示的に分ける:

```ts
screen === 'wizard'
screen === 'review'
screen === 'generating'
screen === 'editor'
```

### 3-5. 既存チャット UI の扱い

`ChatMessageList` / `ChatMessageBubble` / `InterviewProgress` を生成前の主導線として拡張し続けるのはやめる。

扱いは次のいずれかにする:

- 生成前は使わない
- 生成後だけ補助 UI として使う

今回の第一優先は **生成前フローの安定化** であり、チャット表現の維持ではない。

---

## 4. マイルストーン

---

## M1. インタビュードメインモデルと画面状態の分離

### 対象ファイル

- **新規** `src/interview/schema.ts`
- **新規** `src/interview/state.ts`
- **変更** `src/components/AppShell.tsx`

### 変更 1: 質問定義と回答型を `demoData.ts` から分離する

- **現在の場所**: `src/demoData.ts` L45-L67
- **変更前の動作**: `InterviewData` と `ChatMessage` が同居している
- **変更後の動作**: ウィザード用の型・選択肢定義・初期状態を `src/interview/` 配下に切り出す

差分イメージ:

```diff
- export interface InterviewData {
-   theme: string;
-   targetAudience: string;
-   keyMessage: string;
-   styleId: string;
-   slideCount?: string;
-   tone?: string;
-   supplementary: string;
- }
+ export interface AnswerEntry { ... }
+ export interface BriefDraft { ... }
+ export interface InterviewStep { ... }
+ export const INTERVIEW_STEPS: InterviewStep[] = [ ... ]
```

**影響範囲**:
- `AppShell`
- `BriefSummaryCard`
- 今後の wizard コンポーネント

**壊れうるシナリオ**:
- 既存コンポーネントが `InterviewData` を直接 import していると型エラーになる

### 変更 2: `AppShell` の状態を `screen + reducer` に置き換える

- **対象行**: `src/components/AppShell.tsx` L95-L113, L142-L204, L305-L351, L357-L374, L382-L423
- **変更前の動作**:
  - `isGenerated` が画面切り替えの主条件
  - `currentQuestionIndex` が質問進行を持つ
  - `messages` が事実上のヒアリング状態にもなっている
- **変更後の動作**:
  - `screen` が画面状態を持つ
  - `useReducer(interviewWizardReducer)` が回答と進行を持つ
  - `BriefDraft` は reducer state から導出する

差分イメージ:

```diff
- const [isGenerated, setIsGenerated] = useState(false);
- const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1);
- const [messages, setMessages] = useState<ChatMessage[]>(...);
+ const [screen, setScreen] = useState<AppScreen>('wizard');
+ const [wizardState, dispatch] = useReducer(interviewWizardReducer, createInitialWizardState());
+ const briefDraft = buildBriefDraft(wizardState.answers);
```

**影響範囲**:
- 生成前画面の描画条件
- `handleFillSampleBrief`
- `handleNew`

**壊れうるシナリオ**:
- `screen` と `isGenerating` が二重管理になると overlay が誤表示される

### 変更 3: サンプル導線を message 追加ではなく state 注入に変更する

- **対象行**: `src/components/AppShell.tsx` L206-L232
- **変更前の動作**: `messages` に 2 件追加し、`currentQuestionIndex` を末尾に飛ばす
- **変更後の動作**: `dispatch({ type: 'loadSample' })` と `setScreen('review')`

差分イメージ:

```diff
- setCurrentQuestionIndex(QUESTIONS.length);
- setMessages(prev => [...prev, userMsg, assistantMsg]);
+ dispatch({ type: 'loadSample', payload: SAMPLE_ANSWERS });
+ setScreen('review');
```

**壊れうるシナリオ**:
- 既存の summary カードが `messages.find(...)` に依存していると表示が崩れる

### M1 検証基準

- [ ] `npm run lint` が通る
- [ ] `npm run build` が通る
- [ ] `テーマを入力する` を押しても、テーマ文字列が固定文言にならない
- [ ] `サンプルで試す` で review 画面へ直接遷移できる
- [ ] `新規作成` で wizard 初期状態に戻る

---

## M2. Claude風ウィザード UI の新設

### 対象ファイル

- **新規** `src/components/InterviewWizard.tsx`
- **新規** `src/components/QuestionStepCard.tsx`
- **変更** `src/components/AppShell.tsx`

### 変更 1: 生成前画面を `InterviewWizard` に差し替える

- **対象行**: `src/components/AppShell.tsx` L383-L398
- **変更前の動作**: `ChatInterviewSidebar` をフルサイズで使っている
- **変更後の動作**: `screen === 'wizard'` のとき `InterviewWizard` を表示する

差分イメージ:

```diff
- <ChatInterviewSidebar
-   messages={messages}
-   interviewData={interviewData}
-   ...
- />
+ <InterviewWizard
+   steps={INTERVIEW_STEPS}
+   state={wizardState}
+   onAnswerCommit={handleAnswerCommit}
+   onBack={handleBackStep}
+   onCancel={handleNew}
+ />
```

**壊れうるシナリオ**:
- AppShell 側の高さ制御を引き継がず、wizard が縦スクロールできなくなる

### 変更 2: 質問カードで「選択」と「確定」を分離する

- **新規ファイル責務**: `QuestionStepCard.tsx`
- **変更前の動作**: 選択肢ボタンを押した瞬間に `onSendMessage()` が走る
- **変更後の動作**:
  - 選択肢はローカル state に保持
  - `次へ` ボタン押下で commit
  - text step は入力必須チェック後に commit

差分イメージ:

```diff
- onClick={() => onSelectOption(opt)}
+ onClick={() => setPendingChoice(opt)}

- // no footer action
+ <button onClick={handleCommit}>次へ</button>
```

**壊れうるシナリオ**:
- pending state を親に上げすぎると step 移動のたびに選択がリセットされる

### 変更 3: ステップヘッダをウィザード専用に持つ

- **変更前の動作**: `InterviewProgress` は完了 step のみ押せる簡易 UI
- **変更後の動作**:
  - `InterviewWizard` 内に上部タブ / 進捗バーを持つ
  - 表示は 1-based、内部 state は 0-based に統一する

**壊れうるシナリオ**:
- 戻る先 step の回答表示と、現在の `answers` が不整合になる

### M2 検証基準

- [ ] `npm run lint` が通る
- [ ] `npm run build` が通る
- [ ] 各質問で「選択だけでは進まず、確定ボタンで進む」
- [ ] 戻る操作で既回答が再表示される
- [ ] 補足事項ステップで自由入力できる
- [ ] モバイル幅でも質問カードが崩れない

---

## M3. Brief JSON handoff と review 画面の整備

### 対象ファイル

- **新規** `src/interview/brief.ts`
- **変更** `src/components/BriefSummaryCard.tsx`
- **変更** `src/services/geminiService.ts`

### 変更 1: `BriefDraft` を構築する専用関数を作る

- **新規ファイル責務**: `src/interview/brief.ts`
- **変更前の動作**: `Partial<InterviewData>` を都度 UI と生成で直接使う
- **変更後の動作**:
  - `buildBriefDraft(answers)` を導入
  - 表示用の `label` と保存用の `value` を整理して返す

差分イメージ:

```diff
- const token = getDesignToken(interviewData.styleId);
+ const brief = buildBriefDraft(answers);
+ const token = getDesignToken(brief.styleId);
```

**壊れうるシナリオ**:
- `styleId` 未回答時の default token 処理が抜ける

### 変更 2: Review 画面のサマリーを `BriefDraft` 参照に変更する

- **対象行**: `src/components/BriefSummaryCard.tsx` L14-L75
- **変更前の動作**: `interviewData` と `styles` から場当たり的に表示文言を作る
- **変更後の動作**: `briefDraft` を直接受け取り、人間向けラベルだけを表示する

差分イメージ:

```diff
- value={styles.find(s => s.id === interviewData.styleId)?.label || interviewData.styleId}
+ value={briefDraft.styleLabel}
```

**壊れうるシナリオ**:
- sample flow だけ `styleLabel` を持っていないと空表示になる

### 変更 3: 生成サービスの入力を `BriefDraft` 基準にする

- **対象行**: `src/services/geminiService.ts` L91-L123
- **変更前の動作**: `Partial<InterviewData>` をそのままプロンプトに流す
- **変更後の動作**:
  - `generateSlideStructure(briefDraft, apiKey)` に寄せる
  - `targetAudience` / `tone` / `keyMessage` は人間向け文言をプロンプトに入れる
  - `styleId` / `slideCount` は制御値として使う

差分イメージ:

```diff
- ターゲット読者: ${interviewData.targetAudience || "未指定"}
- キーメッセージ: ${interviewData.keyMessage || "未指定"}
+ ターゲット読者: ${briefDraft.targetAudience || "未指定"}
+ キーメッセージ: ${briefDraft.keyMessage || "未指定"}
```

**壊れうるシナリオ**:
- 旧 `InterviewData` 依存の呼び出し箇所が残ると型エラーまたはランタイムエラーになる

### M3 検証基準

- [ ] `npm run lint` が通る
- [ ] `npm run build` が通る
- [ ] review 画面で内部 ID が露出しない
- [ ] `generateSlideStructure()` に渡るプロンプトが人間向け文言になる
- [ ] style / slideCount の制御値は崩れない

---

## M4. 生成遷移の安定化と legacy チャット依存の整理

### 対象ファイル

- **変更** `src/components/AppShell.tsx`
- **変更** `src/components/ChatInterviewSidebar.tsx`
- **変更** `src/demoData.ts`

### 変更 1: 生成中と生成完了の遷移を `screen` で管理する

- **対象行**: `src/components/AppShell.tsx` L234-L274, L376-L473
- **変更前の動作**:
  - `isGenerating` は overlay 用
  - `isGenerated` はレイアウト切り替え用
- **変更後の動作**:
  - 生成開始時に `screen = 'generating'`
  - 構成生成と最低限の初期スライド準備完了で `screen = 'editor'`
  - 画像生成中は editor 内ローディングまたは overlay を継続表示

差分イメージ:

```diff
- setIsGenerating(true);
- ...
- setIsGenerated(true);
+ setScreen('generating');
+ ...
+ setScreen('editor');
```

**壊れうるシナリオ**:
- スライド配列が空のまま `editor` へ入ると中央プレビューが null 表示になる

### 変更 2: `ChatInterviewSidebar` を生成後専用に整理する

- **対象行**: `src/components/ChatInterviewSidebar.tsx` L37-L48, L63-L129
- **変更前の動作**: ヒアリング進行と生成後の左カラムを兼用している
- **変更後の動作**:
  - 生成前では使わない
  - 生成後は `briefDraft` 由来のサマリー表示を主にする
  - 会話ログを残す場合も derived messages に限定する

差分イメージ:

```diff
- const totalSteps = 7;
- let currentStep = 0;
- if (interviewData.theme) currentStep++;
+ // generated mode only
+ const summary = buildSidebarSummary(briefDraft);
```

**壊れうるシナリオ**:
- `messages.length === 1 && welcome-msg` 前提が残っていると空表示になる

### 変更 3: demo 型と wizard 型の境界を整理する

- **対象行**: `src/demoData.ts` 全体
- **変更前の動作**: 実運用で使う型と demo state が混在している
- **変更後の動作**:
  - demo 用メッセージだけを残す
  - interview の実型は `src/interview/` に寄せる

**壊れうるシナリオ**:
- デモ表示に必要な import まで消すと build が壊れる

### M4 検証基準

- [ ] `npm run lint` が通る
- [ ] `npm run build` が通る
- [ ] review から生成開始で確実に editor へ遷移する
- [ ] `新規作成` で editor から wizard 初期状態へ戻る
- [ ] `サンプルで試す` でも同じ遷移経路を通る
- [ ] 生成後の左カラムが message 履歴に依存せず表示できる

---

## 5. 実装時の重要ルール

### 5-1. 生成前フローでは `messages` を正本に戻さない

途中で「既存チャット部品を活かしたい」という理由で state を message 側へ寄せると、今回の設計意図が崩れる。

### 5-2. `AppShell` に再び責務を集めすぎない

`AppShell` は次の責務までに留める:

- screen の切り替え
- API キー管理
- 生成処理の起動
- editor 用 state の保持

質問 UI の内部状態、step ごとの pending input、回答バリデーションは wizard 側に寄せる。

### 5-3. 0-based / 1-based を混在させない

- 内部 state: 0-based
- 表示文言: 1-based

これを厳守する。

### 5-4. Sample flow と通常 flow を同じ state で通す

sample だけ別実装にすると、本番でのみ壊れる。

---

## 6. 壊れうるシナリオ一覧

1. `テーマを入力する` 導線が、自由入力開始ではなく固定文言送信のまま残る
2. step 戻り時に `answers` は戻るが UI 表示が更新されない
3. review 表示ではラベル、生成プロンプトでは ID が必要な箇所を取り違える
4. `screen = 'editor'` に入るタイミングが早すぎて `activeSlideId` が null のままになる
5. sample 導線だけ `styleLabel` や `slideCount` の型が欠ける
6. 既存 `ChatInterviewSidebar` 依存を外しきれず、生成前画面に不要なチャット前提ロジックが残る

---

## 7. 触らないもの

- `src/components/CenterPreviewWorkspace.tsx` のレイアウト自体
- `src/components/RightInspectorPanel.tsx` の編集機能
- `src/components/SlideThumbnailRail.tsx` のサムネイル選択ロジック
- 背景画像生成 API の仕様
- React Router 導入や URL ベース遷移

---

## 8. Phase 2 で検討すること（今回のスコープ外）

Claude 風 UI が安定してから、必要なら以下を段階追加する。

- AI による質問文のパーソナライズ
- AI による選択肢説明文の生成
- theme に応じた候補選択肢の微調整
- editor 左カラムでの追加指示からの再生成

ただし Phase 2 でも、以下は維持する:

- 質問順は固定
- 回答 JSON スキーマは固定
- 画面遷移は `screen` が管理

---

## 9. 完了条件

- 生成前 UI がチャットログではなく、Claude 風の選択式ウィザードになっている
- 回答データが `BriefDraft JSON` として独立管理されている
- `テーマ入力 → ウィザード → Review → Generating → Editor` が安定して動く
- `サンプルで試す` と通常入力が同じデータ経路を通る
- `AppShell` が「状態の集積地」ではなく「画面オーケストレーター」として整理されている
