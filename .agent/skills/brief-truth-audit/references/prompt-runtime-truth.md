# Prompt Runtime Truth

## 現在のプロンプトランタイムの弱点

### 1. answersContext がフラットな箇条書き

`pipeline-core.ts` の `buildPromptsFromQA` / `buildHybridPrompts` では、
QA回答を `answers.map(a => '- ' + a.selectedLabel).join('\n')` で平坦化している。

問題点:
- intent / audience / tone / detail の区別が消失する
- LLM は「この回答がどの意図に対応するか」を推測しなければならない
- 構造化された RichBrief が存在するが、SlideSpec 生成パスではまだ利用されていない

### 2. インライン文字列によるプロンプト構築

`buildSlideSpecPrompt` / `buildBackgroundPromptsPrompt` は関数内にテンプレート文字列を
ハードコードしている。バージョン管理・A/Bテスト・差し替えが困難。

`prompts/infographic/` にファイルベースのプロンプトパックが存在するが、
SlideSpec 生成パスからの参照は限定的。

### 3. 批評ループの欠如

生成された SlideSpec に対する自動批評（critique）→修正（repair）ループが存在しない。
content-quality-gate.ts は presentability warnings を出すが、
LLM に再生成を指示するフィードバックループには接続されていない。

## スキーマ文字数制限（shared-constraints.md 由来）

| フィールド | 制限 | 備考 |
|-----------|------|------|
| headline | 10-20文字 | coverでも20文字以内 |
| subheadline | 12-24文字 | 省略可 |
| eyebrow | 6-14文字 | |
| facts | 各14文字以内、最大2件 | |
| kpis.label | 最大16文字 | |
| kpis.value | 最大12文字 | 数字・小数点・カンマ・%のみ |
| kpis.unit | 最大8文字 | |
| sections.title | 最大16文字 | |
| sections.bullets | 各14文字以内、最大2件 | |
| takeaways | 各24文字以内 | |
| actionItems | 各28文字以内 | |

### DEFAULT_TEXT_SAFETY_BUDGETS（prompt-brief-builder.ts）

| フィールド | 値 |
|-----------|-----|
| headlineMaxChars | 20 |
| factMaxChars | 14 |
| kpiValueMaxChars | 12 |
| kpiUnitMaxChars | 8 |
| eyebrowMaxChars | 14 |

## 「プロンプトが弱い」と「スキーマ切り詰めが攻撃的」の区別

- **プロンプトが弱い**: answersContext が浅い、intent-specific な指示が不足、
  批評ループがない。結果として LLM が汎用的・抽象的な内容を生成する。
  --> 対策: RichBrief の注入、プロンプトパックの活用、critique-repair ループ

- **スキーマ切り詰めが攻撃的**: headline 20文字、facts 14文字など、
  日本語ビジネス文脈では意味のある文を書くのが困難な制限。
  --> 対策: 制限値の調整は text-fit リスクとのトレードオフ。
  compositor のレイアウトエンジンが対応できる範囲でのみ緩和可能。

両者は独立した問題であり、混同してはならない。
プロンプト改善で「何を書くか」の品質が上がっても、
文字数制限で「書けるか」は別の制約として残る。

## 背景プロンプトランタイムの真実

### buildBackgroundPromptsPrompt() の V2 置換

`buildBackgroundPromptsPrompt()` はインラインテンプレート文字列を使用していたが、
V2 ではファイルベースのプロンプトパック (`prompts/backgrounds/nano-banana2/`) に置換可能。

- **プロンプトパック**: `prompts/backgrounds/nano-banana2/` にバージョン管理された
  マスターシステムプロンプト、制約、ページ種別指示、スタイル定義を格納
- **Visual Brief Builder**: `lib/background-visual-brief-builder.ts` が RichBrief + SlideSpec から
  構造化された VisualBrief を構築し、画像プロンプト組み立てに必要なコンテキストを提供
- **8次元批評**: `lib/background-prompt-runtime.ts` が生成前にプロンプト品質を8軸で評価
  (pageKind-adequacy, business-grade-feel, motif-specificity, generic-wallpaper-smell,
   safe-zone-discipline, text-artifact-risk, contrast-clutter-risk, nano-banana2-friendliness)
- **修復ループ**: 批評スコアが閾値未満の場合、LLM による自動修復を実行

### テキスト/背景の分離原則

背景画像には一切テキストを含まない（Background-only policy）。
テキストは slide-compositor.ts で別途合成される。
この分離により、背景プロンプトはビジュアル品質に集中でき、
テキスト切り詰め問題とは独立して改善可能。
