# Lovart Infographic Generator

Gemini API を使い、対話形式で要件を収集し、ビジネス向けインフォグラフィックスライドを生成・編集する standalone SPA。

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
# .env を編集して GEMINI_API_KEY / IMAGE_API_KEY を設定

# 3. 開発サーバー起動（port 3000）
npm run dev
```

**注意**: `npm run dev` は `NODE_ENV` を設定しないため、常に非プロダクションモードとして扱われます。
それでも API キーはサーバー側だけで利用され、クライアントには露出しません。
本番デプロイ（Render 等）でも同様に、Render の環境変数をサーバーが使います。

## API キーについて

### 開発環境

`.env` ファイルに設定した `GEMINI_API_KEY` / `IMAGE_API_KEY` を Express サーバーが直接利用します。
クライアントへ返るのは「サーバー側にキーがあるか」の真偽値だけです。

### 本番環境

Render の環境変数はサーバー側でのみ利用され、クライアントバンドルには含まれません。
構造生成・リサーチ・背景画像生成はすべてサーバー経由で行われます。
UI からの API キー入力は、サーバー側にキーが無い場合のフォールバックです。

**重要**: 入力された API キーはブラウザの localStorage に保存されます。
これは利便性のためのものであり、セキュアな vault ではありません。
共有端末ではログアウト時にキーを削除するようご注意ください。

## 環境変数

| 変数名 | 必須 | 説明 |
| ------ | ---- | ---- |
| `GEMINI_API_KEY` | 推奨 | 構造生成・リサーチ用。画像生成の fallback としても使用 |
| `IMAGE_API_KEY` | No | 背景画像生成用の専用キー。未設定時は `GEMINI_API_KEY` を使用 |
| `API_KEY` | No | 旧来の画像生成キー名。`IMAGE_API_KEY` の legacy alias |
| `APP_URL` | No | ホスティング URL（Render 等でデプロイ時） |
| `PORT` | No | サーバーポート（デフォルト: 3000） |

## ビルド

```bash
npm run build       # dist/ にフロントエンドをビルド
npm run lint        # TypeScript 型チェック（tsc --noEmit）
```

## ディレクトリ構造

```text
├── src/
│   ├── components/
│   │   ├── AppShell.tsx              # メインレイアウト（状態管理の中心）
│   │   ├── AppHeader.tsx             # ヘッダーバー
│   │   ├── ChatInterviewSidebar.tsx  # ヒアリング + チャットUI
│   │   ├── CenterPreviewWorkspace.tsx # スライドキャンバス
│   │   ├── RightInspectorPanel.tsx   # 要素編集パネル
│   │   ├── SlideThumbnailRail.tsx    # スライド一覧
│   │   ├── BriefSummaryCard.tsx      # 要件サマリー
│   │   ├── ChatComposer.tsx          # テキスト入力
│   │   ├── ChatMessageList.tsx       # メッセージ一覧
│   │   ├── ChatMessageBubble.tsx     # 個別メッセージ
│   │   ├── InterviewProgress.tsx     # ステップ進捗
│   │   ├── TopCanvasToolbar.tsx      # ツールバー（UI のみ）
│   │   └── DownloadActions.tsx       # ダウンロードボタン（UI のみ）
│   ├── services/
│   │   ├── geminiService.ts          # サーバー側 Gemini 呼び出し
│   │   └── generationClient.ts       # クライアント -> サーバー生成API 呼び出し
│   ├── designTokens.ts              # テンプレート別デザイントークン
│   ├── demoData.ts                  # 型定義 + モック + デモステート
│   ├── index.css                    # Tailwind v4 エントリ
│   ├── main.tsx                     # React エントリポイント
│   └── App.tsx                      # ルートコンポーネント
├── server.ts                        # Express + Vite dev middleware + 生成API
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## 既知の制約と未解決事項

1. **TopCanvasToolbar**: テキスト追加・シェイプ・画像挿入・Undo/Redo/Zoom は UI のみで未実装
2. **DownloadActions**: PDF/ZIP/HTML ダウンロードは UI のみで未実装
3. **BriefSummaryCard**: 「編集」ボタンは機能なし
4. **生成後の追加指示**: 「再生成機能は開発中です」メッセージで止まる
5. **編集結果の永続化**: 現状はメモリ内のみ（リロードで消える）
