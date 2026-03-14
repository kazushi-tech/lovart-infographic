# ヒアリング品質起点のスライド品質改善プラン — 7マイルストーン再設計

## 判断

現行プランをそのまま進めるのは非推奨。

理由は明確で、いまの品質劣化は後段のレイアウトや UI だけではなく、前段のヒアリング設計で情報を取り落としているから。

1. **質問が固定**  
   `INTERVIEW_STEPS` が固定文言の 7 問で定義されており、テーマに応じて問い方が変わらない。  
   参照: `src/interview/schema.ts`
2. **Adaptive と書かれているが、実態は簡易ヒューリスティック**  
   `adaptiveInterviewService.ts` は英単語ベースの並び替え中心で、認識齟齬を潰す確認質問にはなっていない。  
   参照: `src/services/adaptiveInterviewService.ts`
3. **しかも adaptive 質問が実運用にほぼ入っていない**  
   現在の画面遷移は固定ステップ前提で、確認質問を差し込む状態管理がない。  
   参照: `src/interview/state.ts`, `src/components/assistant/AssistantShell.tsx`
4. **生成前レビューが「要約表示」で止まっている**  
   `WizardReviewView` は項目一覧を見せるだけで、曖昧回答や不足情報を止める役割を持っていない。  
   参照: `src/components/assistant/WizardReviewView.tsx`
5. **生成プロンプトが情報を落としている**  
   `buildRichBrief()` / `formatRichBriefNarrative()` と `promptTemplates.ts` があるのに、`geminiService.ts` はまだ単純な埋め込み中心。  
   参照: `src/interview/brief.ts`, `src/services/geminiService.ts`, `src/services/promptTemplates.ts`

したがって、優先順位は「UI 修正」ではなく、まず **質問品質 -> 認識合わせ -> プロンプト反映** に組み替えるべき。

---

## ゴール

1. テーマごとに質問が変わる
2. 曖昧な回答には確認質問が入る
3. 生成前に「AI がどう理解したか」をユーザーが確認できる
4. その確認内容が実際のプロンプトに反映される
5. その上で evidence / validation / UI を仕上げる

---

## M1: ヒアリング回答の品質基準を定義する

**目的**: 「回答は埋まっているが、解像度が足りない」状態を検出できるようにする

### 変更ファイル
| File | 変更内容 |
|------|---------|
| `src/interview/schema.ts` | `AnswerEntry` を拡張し、`confidence`, `needsFollowUp`, `qualityFlags` などを保持できるようにする |
| `src/interview/state.ts` | `buildBriefDraft()` とは別に、回答品質を集計する `buildBriefQuality()` を追加 |
| `src/interview/brief.ts` | レビュー表示用に「不足」「曖昧」「要確認」項目をまとめる関数を追加 |
| `src/components/assistant/WizardReviewView.tsx` | 品質警告の表示領域を追加 |
| `src/interview/answerQuality.ts` | 新規。フィールド別の判定ルールを実装 |

### 実装ポイント
- `theme` が短すぎる、抽象語だけ、対象領域が不明なら warning
- `targetAudience` が「経営層」「社員」だけで終わっている場合は warning
- `keyMessage` に「何を」「なぜ」「どうしてほしい」が含まれない場合は critical
- `supplementary` が空でも良いが、比較・数値・ロードマップなどテーマ上必要な情報が欠ける場合は warning
- 生成ボタンは `critical` が残っている間は無効化する

### 検証
- テーマが「業務改善」だけなら follow-up 必須になる
- ターゲットが「経営層」だけなら「どの意思決定者か」を確認対象にできる
- キーメッセージが「AIは重要」だけなら生成前に止まる

---

## M2: テーマ依存の確認質問エンジンを作る

**目的**: 質問文を固定せず、テーマと既回答に応じて聞き返せるようにする

### 変更ファイル
| File | 変更内容 |
|------|---------|
| `src/services/adaptiveInterviewService.ts` | 単なる選択肢並び替えをやめ、`question`, `reason`, `options`, `fallbackPrompt` を返すよう再設計 |
| `src/hooks/useAdaptiveOptions.ts` | options だけでなく follow-up question packet を扱えるよう更新 |
| `src/interview/schema.ts` | `AdaptiveQuestionPacket`, `FollowUpStep` などの型を追加 |
| `src/interview/followUpTemplates.ts` | 新規。テーマ分類別の deterministic fallback を定義 |

### 実装ポイント
- まずは LLM 依存ではなく、ルールベース + 将来 AI 差し替え可能な構造にする
- 確認質問は毎回出すのではなく、`qualityFlags` が立った時だけ出す
- 質問文には「なぜこれを聞くか」を 1 行添える
- 選択肢もテーマ依存にする
  - 採用広報なら `候補者層`, `訴求価値`, `信頼材料`
  - SaaS 提案なら `導入部門`, `業務課題`, `CTA`
  - 社内研修なら `受講者レベル`, `期待行動`, `評価指標`

### 検証
- テーマごとに確認質問が変わる
- 「AI導入」「採用ブランディング」「新人研修」で follow-up の中身が明確に異なる
- 既に具体的な回答が入っている場合は不要な確認質問を出さない

---

## M3: 固定 7 問フローを「基本質問 + 条件付き確認質問」に変える

**目的**: 実際に follow-up を差し込める UI / state に変える

### 変更ファイル
| File | 変更内容 |
|------|---------|
| `src/interview/state.ts` | 固定 `activeStepIndex` だけでなく、動的ステップ列を扱える reducer に変更 |
| `src/components/assistant/AssistantShell.tsx` | 現在 step の解決元が固定配列前提なので、動的 step 配列を受けるよう変更 |
| `src/components/assistant/WizardStepDialog.tsx` | follow-up 理由表示、自由入力と確認質問の両対応 |
| `src/components/assistant/WizardStepTabs.tsx` | 基本質問と確認質問を見分けて表示 |
| `src/components/AppShell.tsx` | 回答確定時に品質判定 -> follow-up 追加判定を実行 |

### 実装ポイント
- 基本ステップは維持するが、`targetAudience` / `keyMessage` / `supplementary` の後に条件付き step を挿入できるようにする
- preset 選択で即 auto-advance する挙動は維持してよいが、follow-up step は明示的送信に寄せる
- 回答に `source: choice | text | follow-up` を残し、どこで補完されたか追跡できるようにする
- 「その他」入力はそのまま通すのではなく、必要なら確認質問へつなぐ

### 検証
- 固定 7 問だけで終わらず、必要時のみ 1〜3 問追加される
- 不要な follow-up が無限に増えない
- 戻る操作で follow-up を含めて正しく編集できる

---

## M4: 生成前レビューを「認識合わせゲート」に変える

**目的**: 生成前に AI の理解をユーザーとすり合わせる

### 変更ファイル
| File | 変更内容 |
|------|---------|
| `src/components/assistant/WizardReviewView.tsx` | 単なる項目一覧ではなく、「AI の理解」「不足情報」「前提」「要確認」を表示 |
| `src/interview/brief.ts` | レビュー用の要約を `項目一覧` から `生成ブリーフ` に強化 |
| `src/components/assistant/AssistantShell.tsx` | 要確認項目がある場合に該当 step へジャンプできる導線を追加 |

### 実装ポイント
- レビューは最低でも以下を表示する
  - 誰に向けた資料か
  - 相手に最終的に何を理解・判断・実行してほしいか
  - 必ず入れるべき数値 / 比較 / ロードマップ / 事例
  - AI が置いている前提
- `critical` は生成不可
- `warning` は生成可能だが、明示表示してユーザーに認識させる
- 「この理解で生成する」ボタン文言に変更し、確認行為を強める

### 検証
- ユーザーが生成前に「この内容ならズレていない」と判断できる
- 認識のズレがある場合、該当 step に 1 クリックで戻れる

---

## M5: ブリーフとプロンプトを一本化する

**目的**: ヒアリング結果を欠損なくスライド生成に渡す

### 変更ファイル
| File | 変更内容 |
|------|---------|
| `src/services/geminiService.ts` | `interviewData` だけでなく、回答全文とレビュー済み brief を受け取るよう変更 |
| `src/components/AppShell.tsx` | `generateSlideStructure()` 呼び出しを `wizardState.answers` ベースに変更 |
| `src/interview/brief.ts` | `buildRichBrief()` を follow-up 統合済みの最終 brief に対応 |
| `src/services/promptTemplates.ts` | 既存の quality rules / anti-patterns / page requirements を実際に利用する |

### 実装ポイント
- `buildRichBrief()` / `formatRichBriefNarrative()` を正式ルートにする
- `promptTemplates.ts` の helper を `geminiService.ts` に組み込む
- 回答をそのまま列挙するだけでなく、以下を prompt に入れる
  - confirmed audience
  - confirmed decision / CTA
  - must-include items
  - avoid items / unresolved assumptions
- 「QAで収集した情報は必ずどこかのスライドに反映する」だけでは弱いので、slide ごとの coverage を意識させる

### 検証
- prompt ログに review 済み brief が含まれる
- 採用テーマでは採用文脈、営業テーマでは提案文脈に寄った構成になる
- generic headline の頻度が目視で下がる

---

## M6: evidence / validation を前後両面で可視化する

**目的**: 内容の薄さと根拠不足を生成前後で把握できるようにする

### 変更ファイル
| File | 変更内容 |
|------|---------|
| `src/interview/state.ts` | `evidenceMode: 'auto'` をデフォルト化 |
| `src/components/AppShell.tsx` | 研究結果と validation 結果を review / editor の両方へ流す |
| `src/components/RightInspectorPanel.tsx` | スライドごとの validation warnings を表示 |
| `src/slides/layoutCompiler.ts` | `evidenceRefs` の脚注描画を追加 |
| `src/slides/layoutTemplates.ts` | evidence footnote slot を追加 |

### 実装ポイント
- 生成前: 「このテーマでは数値根拠が不足」も見せる
- 生成後: `contentValidator.ts` の結果を右パネルで確認可能にする
- `sourceNote` と `evidenceRefs` を両方表示し、根拠の追跡性を持たせる

### 検証
- `/api/research` が発火する
- `evidenceRefs` があるスライドでは脚注が見える
- source が不足するスライドでは warning が表示される

---

## M7: 編集体験と視覚品質を仕上げる

**目的**: 品質改善後のアウトプットを編集しやすく、見た目でも毀損しない状態にする

### 変更ファイル
| File | 変更内容 |
|------|---------|
| `src/components/TopCanvasToolbar.tsx` | ズーム / Undo / Redo を接続 |
| `src/components/CenterPreviewWorkspace.tsx` | ズーム反映、背景の視認性改善、不要な blend/grid 除去 |
| `src/components/AppShell.tsx` | history stack, zoom state, drag handle 改善 |

### 実装ポイント
- これは必要だが、順番は最後
- 前段のヒアリング改善なしにここを先にやっても、悪いスライドが編集しやすくなるだけ

### 検証
- ズーム / Undo / Redo が動く
- 背景画像が色あせない
- ハンドルが掴みやすい

---

## 実行順序

```text
M1 回答品質定義
→ M2 テーマ依存の確認質問
→ M3 動的 step 化
→ M4 生成前レビューゲート
→ M5 brief / prompt 一本化
→ M6 evidence / validation 可視化
→ M7 編集 UI / 視覚品質
```

### 理由

- いまの不満の根は upstream にある
- 認識齟齬を潰さない限り、後段の prompt 改善も UI 改善も効きが弱い
- 先にヒアリング品質を上げれば、その後の evidence / validation / editor 改善も意味を持つ

---

## 追加の検証マトリクス

### 1. テーマ別質問変化

- `AI導入による営業改革`
  - 決裁者、導入部門、成果指標を聞き返せるか
- `採用ブランディング強化`
  - 候補者層、EVP、実績証拠を聞き返せるか
- `新人向けセキュリティ研修`
  - 受講者レベル、期待行動、評価方法を聞き返せるか
- `既存顧客向けアップセル提案`
  - 既存課題、提案価値、CTA を聞き返せるか

### 2. 曖昧回答検知

- `テーマ: 業務改善`
- `ターゲット: 経営層`
- `キーメッセージ: AIは重要`

上記のような曖昧セットで、そのまま生成に進ませないこと。

### 3. 生成品質

- 同じテーマで「確認質問あり / なし」を比較し、headline / facts / CTA の具体性が改善すること
- 汎用見出し、薄い bullet、無根拠数値が減ること

### 4. 回帰確認

1. `npm run build`
2. `npm run dev`
3. 手動確認
   - 基本質問
   - 条件付き確認質問
   - 生成前レビュー
   - スライド生成
   - validation 表示
   - evidence 表示
   - ズーム / Undo / Redo

---

## 先にやらないこと

- 生成後チャットによる全面再生成
- プレビュー専用モード
- 大規模なテンプレート総入れ替え

まずは「質問でズレを潰せているか」を通すことが先。
