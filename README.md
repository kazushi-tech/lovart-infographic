# Infographic Generator — Reference App

AI Studio で構築された参照実装。Gemini API を使い、対話形式で要件を収集し、ビジネス向けインフォグラフィックスライドを生成・編集する。

## 技術スタック

- **Frontend**: React 19, TypeScript 5.8, Tailwind CSS v4 (`@tailwindcss/vite`), Vite 6
- **Backend**: Node.js, Express, tsx (dev server)
- **AI**: `@google/genai` SDK
  - 構造生成: `gemini-3.1-pro-preview`
  - 画像生成: `gemini-3.1-flash-image-preview`

## 機能一覧

### ヒアリング画面（生成前）

- テーマ入力またはサンプルデータで開始
- デザインテンプレート選択（5種: Corporate / Professional / Executive / Modern / Minimal）
- スライド枚数選択（3 / 5 / 8 / 10）
- ターゲット・キーメッセージ・トーン・補足のステップ式ヒアリング
- ステップを戻って回答修正可能
- 要件サマリーカード表示後に「生成する」ボタン

### エディタ画面（生成後）

- 3カラムレイアウト: チャット | キャンバス | インスペクタ
- 左右レールのドラッグリサイズ
- キャンバス上で要素クリック選択
- 右レールでテキスト編集・フォントサイズ・色・太字・配置変更
- キャンバス上で要素ドラッグ移動
- スライドサムネイルレール（下部）

## ローカル起動

```bash
# 1. 依存関係インストール
npm install

# 2. 環境変数を設定
cp .env.example .env
# .env を編集して API_KEY / GEMINI_API_KEY を設定

# 3. 開発サーバー起動（port 3000）
npm run dev
```

**注意**: 親プロジェクト（Nano Banana本体）と同時に開発する場合、親の PostCSS/Tailwind v3 が干渉するため `postcss.config.mjs` を `reference/` 直下に配置している。この設定は削除しないこと。

## ビルド

```bash
npm run build       # dist/ にフロントエンドをビルド
npm run lint        # TypeScript 型チェック（tsc --noEmit）
```

## ディレクトリ構造

```text
reference/
├── src/
│   ├── components/
│   │   ├── AppShell.tsx           # メインレイアウト（状態管理の中心）
│   │   ├── AppHeader.tsx          # ヘッダーバー
│   │   ├── ChatInterviewSidebar.tsx  # ヒアリング + チャットUI
│   │   ├── CenterPreviewWorkspace.tsx # スライドキャンバス
│   │   ├── RightInspectorPanel.tsx    # 要素編集パネル
│   │   ├── SlideThumbnailRail.tsx     # スライド一覧
│   │   ├── BriefSummaryCard.tsx       # 要件サマリー
│   │   ├── ChatComposer.tsx           # テキスト入力
│   │   ├── ChatMessageList.tsx        # メッセージ一覧
│   │   ├── ChatMessageBubble.tsx      # 個別メッセージ
│   │   ├── InterviewProgress.tsx      # ステップ進捗
│   │   ├── TopCanvasToolbar.tsx       # ツールバー（UI のみ）
│   │   └── DownloadActions.tsx        # ダウンロードボタン（UI のみ）
│   ├── services/
│   │   └── geminiService.ts       # Gemini API 呼び出し
│   ├── designTokens.ts            # テンプレート別デザイントークン
│   ├── demoData.ts                # 型定義 + モック + デモステート
│   ├── index.css                  # Tailwind v4 エントリ
│   ├── main.tsx                   # React エントリポイント
│   └── App.tsx                    # ルートコンポーネント
├── server.ts                      # Express + Vite dev middleware
├── postcss.config.mjs             # 親プロジェクトの Tailwind v3 遮断用
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## 既知の制約と未解決事項

1. **TopCanvasToolbar**: テキスト追加・シェイプ・画像挿入・Undo/Redo/Zoom は UI のみで未実装
2. **DownloadActions**: PDF/ZIP/HTML ダウンロードは UI のみで未実装
3. **BriefSummaryCard**: 「編集」ボタンは機能なし
4. **生成後の追加指示**: 「再生成機能は開発中です」メッセージで止まる
5. **server.ts**: PORT が 3000 にハードコード

## Nano Banana 本体への統合メモ

### 移植候補コンポーネント

- `ChatInterviewSidebar` + 関連コンポーネント: ヒアリングフロー
- `CenterPreviewWorkspace` + `RenderElement`: キャンバスとドラッグ移動
- `RightInspectorPanel`: 要素編集UI
- `designTokens.ts`: テンプレート別配色定義

### データ受け渡し

- 本体の `SlideSpec` (pipeline-core-types.ts) と `reference/` の `SlideData` (demoData.ts) は `pageKind`, `eyebrow`, `headline`, `kpis` 等のフィールドが共通
- `ElementData` (座標+スタイル) は本体の overlay レイヤーに相当
- 変換アダプターが必要: `SlideSpec → SlideData` (表示用) と `SlideData → SlideSpec` (パイプライン保存用)

### 本体側で追加調整が必要なポイント

- `slide-specs.json` の fetch タイミング問題（Phase 1 で既知）
- 編集結果の永続化（現状はメモリ内のみ）
- API キーの扱い（本体は APP_PASSWORD 認証、reference は環境変数直接）
